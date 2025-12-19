// src/BookConsultation.jsx
// 🔥 Firebase
import { auth } from "./firebase";
import { db } from "./firebase";

// 🔥 Firestore helpers
import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Phone, ExternalLink } from "lucide-react";
import Navbar from "./Navbar";
import "./bookconsultation.css";

const BookConsultation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const lawyerFromState = location.state?.lawyer || null;

  // Date navigation state (useful for month/year switching)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0..11

  // selectedDate will be a Date object (or null)
  const [selectedDate, setSelectedDate] = useState(null);

  const [selectedTime, setSelectedTime] = useState("10:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneCode: "+91",
    legalMatter: "",
    typeOfMatter: "",
    caseType: "",
    caseSummary: "",
    timezone: "India Standard Time",
  });

  const [showFullBio, setShowFullBio] = useState(false);
const [alertModal, setAlertModal] = useState(null);

  // confirmation state: null or { show:true, date, time, lawyerName }
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // When component mounts or lawyer changes, redirect if no lawyer and fetch booked slots
  useEffect(() => {
    if (!lawyerFromState) {
      navigate("/find-lawyer");
      return;
    }
    fetchBookedSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawyerFromState, navigate]);

  // ---------- Helpers to read lawyer fields robustly ----------
  const getField = (lawyerObj, ...keys) => {
    if (!lawyerObj) return undefined;
    for (const k of keys) {
      if (k in lawyerObj && lawyerObj[k] !== undefined && lawyerObj[k] !== null) {
        return lawyerObj[k];
      }
    }
    // also check raw
    if (lawyerObj._raw) {
      for (const k of keys) {
        if (k in lawyerObj._raw && lawyerObj._raw[k] !== undefined && lawyerObj._raw[k] !== null) {
          return lawyerObj._raw[k];
        }
      }
    }
    return undefined;
  };

  const getEmail = (lawyerObj) =>
    getField(lawyerObj, "email", "Email", "contact_email", "e-mail", "mail", "emailAddress");

  const getPhone = (lawyerObj) =>
    getField(lawyerObj, "phone", "Phone", "contact", "contact_phone", "contactNumber");

  const getBio = (lawyerObj) => getField(lawyerObj, "bio", "Bio", "description", "about", "_bio");

  const getImageUrl = (lawyerObj) =>
    getField(lawyerObj, "image_url", "image", "photo", "avatar") ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(getField(lawyerObj, "name") || "Lawyer")}&background=random&size=200`;

  const getLinkedIn = (lawyerObj) =>
    getField(lawyerObj, "linkedin", "LinkedIn", "profile_linkedIn") ||
    getField(lawyerObj, "website", "profile_url");

  // ---------- Booking slots fetch ----------
  const fetchBookedSlots = async () => {
    try {
      const lawyerEmail =
        getEmail(lawyerFromState) ||
        lawyerFromState?.email ||
        lawyerFromState?.Email ||
        lawyerFromState?.id ||
        lawyerFromState?.name ||
        "";

      if (!lawyerEmail) {
        console.warn("⚠️ No lawyer email found, skipping booking fetch");
        setBookedSlots([]);
        return;
      }

      const url = `http://localhost:5000/api/bookings/${encodeURIComponent(lawyerEmail)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Bookings endpoint returned", res.status);
        setBookedSlots([]);
        return;
      }
      const data = await res.json();
      setBookedSlots(data.bookings || []);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
      setBookedSlots([]);
    }
  };

  // ---------- Calendar generation for the currentMonth/currentYear ----------
  // returns an array of days padded with nulls for leading blanks
  const generateCalendarDays = (year, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1);
    const startWeekday = firstDay.getDay(); // 0 Sun ... 6 Sat
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();

    const arr = [];
    // leading null placeholders
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  };

  // For memoization
  const calendarDays = useMemo(() => generateCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // update available times when selected date or bookedSlots changes
  useEffect(() => {
    if (selectedDate) {
      updateAvailableTimes();
    } else {
      setAvailableTimes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, bookedSlots]);

  const updateAvailableTimes = () => {
    if (!selectedDate) return;
    const bookingDateStr = formatDateISO(selectedDate); // yyyy-mm-dd
    const allTimes = ["09:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"];
    const available = allTimes.filter(t => !isSlotBooked(bookingDateStr, t));
    setAvailableTimes(available);
    if (selectedTime && !available.includes(selectedTime)) setSelectedTime(available[0] || "10:00");
  };

  const isSlotBooked = (dateISO, time) => {
    return bookedSlots.some(slot => slot.date === dateISO && slot.time === time);
  };

  // helper to format Date -> yyyy-mm-dd
  const formatDateISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // ---------- navigation handlers ----------
  const prevMonth = () => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };
  const nextMonth = () => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };
  const prevYear = () => setCurrentYear(y => y - 1);
  const nextYear = () => setCurrentYear(y => y + 1);

  // click a day -> build a Date object in current month/year
  const handleDayClick = (day) => {
    if (!day) return;
    const clicked = new Date(currentYear, currentMonth, day);
    // don't allow past days
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (clicked < todayStart) {
      // optional: show message
      return;
    }
    setSelectedDate(clicked);
  };

  // ---------- form handlers ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const showAlert = (message, type = "error") => {
  setAlertModal({ show: true, message, type });
  setTimeout(() => {
    setAlertModal(null);
  }, 4000);
};

const handleSubmit = async () => {
  if (!selectedDate) {
    showAlert("Please select a date");
    return;
  }
  
  if (!formData.firstName || !formData.email) {
    showAlert("Please fill in all required fields");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    showAlert("You must be logged in to book a consultation");
    return;
  }

  const lawyerEmail = getEmail(lawyerFromState);
  const bookingDate = formatDateISO(selectedDate);
  const slotId = `${lawyerEmail}_${bookingDate}_${selectedTime}`;

  setIsSubmitting(true);

  // 🔐 SLOT LOCK
  try {
    await setDoc(doc(db, "bookings", slotId), {
      lawyerEmail,
      lawyerName: getField(lawyerFromState, "name"),
      date: bookingDate,
      time: selectedTime,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    if (err.code === "permission-denied") {
      showAlert("⚠️ This slot has just been booked by another user. Please choose a different time.");
      fetchBookedSlots();
      setIsSubmitting(false);
      return;
    }
    showAlert("Booking failed. Please try again.");
    setIsSubmitting(false);
    return;
  }

  // 📧 EMAIL BACKEND
  await fetch("http://localhost:5000/api/book-consultation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lawyer: { name: getField(lawyerFromState, "name"), email: lawyerEmail },
      booking: {
        ...formData,
        date: bookingDate,
        time: selectedTime,
      },
    }),
  });

  setBookingConfirmation({
    show: true,
    date: bookingDate,
    time: selectedTime,
    lawyerName: getField(lawyerFromState, "name"),
  });

  fetchBookedSlots();
  setIsSubmitting(false);
};


  if (!lawyerFromState) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="booking-container">Redirecting...</div>
      </div>
    );
  }

  const lawyer = lawyerFromState;
  const phone = getPhone(lawyer);
  const email = getEmail(lawyer);
  const bio = getBio(lawyer) || "";
  const linkedin = getLinkedIn(lawyer);
  const imageUrl = getImageUrl(lawyer);

  // helper to check if a whole day is booked (if you store bookedSlots by date/time)
  const isDayFullyBooked = (dateISO) => {
    // Example heuristic: if every time in our times list is booked for that date it's fully booked
    const times = ["09:00","10:00","11:00","12:00","1:00","2:00","3:00","4:00","5:00","6:00"];
    const bookedForDate = bookedSlots.filter(s => s.date === dateISO).map(s => s.time);
    return times.every(t => bookedForDate.includes(t));
  };

  // render
  return (
    <div className="booking-page">
      <Navbar />
      <div className="booking-container">
        <div className="booking-left">
          <div className="lawyer-profile-card">
            <div className="lawyer-profile-header">
              <img src={imageUrl} alt={getField(lawyer, "name")} className="lawyer-profile-img" />
            </div>

            <div className="lawyer-profile-info">
              <h2>{getField(lawyer, "name")}</h2>
              <p className="lawyer-title">{getField(lawyer, "specialization") || "Legal Practitioner"}</p>
              {email && <p className="lawyer-email">{email}</p>}
              <div className="profile-contact-row">
                {phone && (
                  <a className="contact-pill" href={`tel:${phone}`} onClick={(e) => e.stopPropagation()}>
                    <Phone size={14} /> <span style={{ marginLeft: 8 }}>{phone}</span>
                  </a>
                )}
                {linkedin && (
                  <a className="contact-pill" href={linkedin} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink size={14} /> <span style={{ marginLeft: 8 }}>LinkedIn</span>
                  </a>
                )}
              </div>

              <p className="consultation-price">Consultation Fee - ₹{getField(lawyer, "consultationFee") || "Not specified"}</p>
              <p className="consultation-note"><AlertCircle size={16} /> This booking notifies the lawyer directly.</p>

              {bio ? (
                <div className="profile-bio">
                  <p style={{ margin: 0 }}>{showFullBio ? bio : bio.slice(0, 140)}{bio.length > 140 && !showFullBio ? "..." : ""}</p>
                  {bio.length > 140 && <button className="read-more-btn" onClick={() => setShowFullBio(s => !s)}>{showFullBio ? "Show less" : "Read more"}</button>}
                </div>
              ) : <p className="profile-bio-empty">No profile summary available.</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            <h3>Your Information</h3>
            <div className="form-section">
              <label>Full Name</label>
              <div className="name-row">
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required />
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required />
              </div>

              <div className="form-row">
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                <select name="phoneCode" value={formData.phoneCode} onChange={handleInputChange}>
                  <option>+91</option><option>+1</option><option>+44</option>
                </select>
              </div>

              <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} required />
            </div>

            <h3>Legal Matter Details</h3>
            <div className="form-section">
              <input type="text" name="legalMatter" placeholder="Legal Matter" value={formData.legalMatter} onChange={handleInputChange} required />

              <div className="form-row" style={{ marginTop: 12 }}>
              
                <select name="caseType" value={formData.caseType} onChange={handleInputChange} required>
                  <option value="">Case Type</option>
                  <option>Individual</option>
                  <option>Business</option>
                </select>
              </div>

              <textarea name="caseSummary" placeholder="Case Summary..." rows="4" value={formData.caseSummary} onChange={handleInputChange} required />
            </div>
          </form>
        </div>

        {/* Right section with calendar */}
        <div className="booking-right">
          <div className="calendar-section">
            <div className="calendar-header" style={{ flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="nav-btn" type="button" onClick={prevYear}>&lt; Prev Year</button>
                  <div style={{ fontWeight: 700 }}>{currentYear}</div>
                  <button className="nav-btn" type="button" onClick={nextYear}>Next Year &gt;</button>
                </div>

                {/* Month navigator: arrows + month label */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="icon-btn" type="button" onClick={prevMonth}>&lt;</button>
                  <div style={{ fontWeight: 700 }}>{months[currentMonth]}</div>
                  <button className="icon-btn" type="button" onClick={nextMonth}>&gt;</button>
                </div>
              </div>
            </div>

            {/* Large single-month calendar */}
            <div className="large-calendar" style={{ marginTop: 10 }}>
              <div className="large-calendar-header">
                <div className="month-title">{months[currentMonth]} {currentYear}</div>
              </div>

              <div className="large-calendar-grid" style={{ marginTop: 8 }}>
                {weekDays.map(w => <div className="wd" key={w}>{w}</div>)}
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    // render an invisible placeholder
                    return <div key={`empty-${idx}`} className="calendar-day empty" />;
                  }

                  const candidate = new Date(currentYear, currentMonth, day);
                  const iso = formatDateISO(candidate);
                  const now = new Date(); const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const isPast = candidate < todayStart;
                  const fullyBooked = isDayFullyBooked(iso);

                  const isSelected = selectedDate && selectedDate.getFullYear() === currentYear && selectedDate.getMonth() === currentMonth && selectedDate.getDate() === day;

                  let cls = "calendar-day";
                  if (isPast) cls += " past";
                  else if (fullyBooked) cls += " booked";
                  if (isSelected) cls += " selected";

                  return (
                    <div
                      key={iso}
                      className={cls}
                      onClick={() => {
                        if (isPast) return;
                        if (fullyBooked) return;
                        handleDayClick(day);
                      }}
                      title={fullyBooked ? "Fully booked" : isPast ? "Past date" : `Select ${iso}`}
                      style={{ userSelect: "none" }}
                    >
                      <div style={{ width: "100%", display: "flex", justifyContent: isSelected ? "center" : "flex-start", paddingLeft: isSelected ? 0 : 6 }}>
                        <div style={{ fontWeight: isSelected ? 700 : 600 }}>{day}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="time-section" style={{ marginTop: 12 }}>
            <label>Time</label>
            {!selectedDate ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>Select a date to see available times</p>
            ) : availableTimes.length === 0 ? (
              <p className="no-slots">No available slots for this date</p>
            ) : (
              <div className="time-slots-grid">
                {availableTimes.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`time-slot-btn ${selectedTime === t ? "selected" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

          </div>

          <button type="button" className="confirm-booking-btn" onClick={handleSubmit} disabled={isSubmitting || !selectedDate || availableTimes.length === 0} style={{ marginTop: 12 }}>
            {isSubmitting ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>

           {/* ---------- In-app confirmation (Google-pay-like) ---------- */}
      {bookingConfirmation && bookingConfirmation.show && (
        <div className="booking-confirmation-overlay" role="dialog" aria-live="polite">
          <div className="booking-confirmation-card">
            <div className="check-circle">✓</div>
            <div className="confirmation-title">Consultation booked!</div>
            <div className="confirmation-details">
              <div><strong>Date:</strong> {bookingConfirmation.date}</div>
              <div><strong>Time:</strong> {bookingConfirmation.time}</div>
              <div style={{ marginTop: 6, color: "#555" }}>With <strong>{bookingConfirmation.lawyerName}</strong></div>
            </div>

            <div className="confirmation-actions">
              <button
                className="conf-btn view-btn"
                onClick={() => {
                  setBookingConfirmation(null);
                  navigate("/my-bookings");
                }}
              >
                View booking
              </button>

              <button
                className="conf-btn close-btn"
                onClick={() => setBookingConfirmation(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Alert Modal ---------- */}
      {alertModal && alertModal.show && (
        <div className="booking-confirmation-overlay" role="dialog" aria-live="assertive">
          <div className="booking-confirmation-card alert-card">
            <div className={`check-circle ${alertModal.type === "error" ? "error-circle" : "info-circle"}`}>
              {alertModal.type === "error" ? "✕" : "ℹ"}
            </div>
            <div className="confirmation-title">
              {alertModal.type === "error" ? "Oops!" : "Notice"}
            </div>
            <div className="confirmation-details">
              <div>{alertModal.message}</div>
            </div>

            <div className="confirmation-actions">
              <button
                className="conf-btn close-btn-full"
                onClick={() => setAlertModal(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookConsultation;