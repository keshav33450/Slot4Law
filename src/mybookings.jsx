import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { auth, db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./mybookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // cancel modal
  const [confirmCancel, setConfirmCancel] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchBookings(u.uid);
      } else {
        setUser(null);
        setBookings([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchBookings = async (uid) => {
    try {
      const q = query(collection(db, "bookings"), where("userId", "==", uid));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoading(false);
    }
  };

  // check past booking
  const isBookingPast = (date, time) => {
    try {
      const [year, month, day] = date.split("-").map(Number);
      const [hours, minutes] = time.split(":").map(Number);
      const bookingDateTime = new Date(year, month - 1, day, hours, minutes);
      return bookingDateTime < new Date();
    } catch {
      return false;
    }
  };

  // open cancel modal
  const requestCancel = (booking) => {
    setConfirmCancel({
      bookingId: booking.id,
      lawyerName: booking.lawyerName
    });
  };

  // confirm cancel
  const confirmCancelBooking = async () => {
    if (!confirmCancel) return;

    try {
      await deleteDoc(doc(db, "bookings", confirmCancel.bookingId));
      setBookings(prev =>
        prev.filter(b => b.id !== confirmCancel.bookingId)
      );
    } catch (err) {
      console.error("Cancel failed", err);
    } finally {
      setConfirmCancel(null);
    }
  };

  // 🔥 DELETE BUTTON (instant delete)
  const deleteBooking = async (bookingId) => {
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <p style={{ padding: 20 }}>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <Navbar />

      <div className="my-bookings-container">
        <h2>My Bookings</h2>

        {bookings.length === 0 ? (
          <p className="empty-text">You have no bookings yet.</p>
        ) : (
          bookings.map((b) => {
            const isPast = isBookingPast(b.date, b.time);

            return (
              <div
                className={`booking-card ${isPast ? "past-booking" : ""}`}
                key={b.id}
              >
                <div className="booking-info">
                  <h4>{b.lawyerName}</h4>
                  <p><strong>Date:</strong> {b.date}</p>
                  <p><strong>Time:</strong> {b.time}</p>
                  <p className="email">{b.lawyerEmail}</p>

                  {isPast && (
                    <span className="past-badge">Completed</span>
                  )}
                </div>

                <div className="booking-actions">
                  {!isPast && (
                    <button
                      className="cancel-btn"
                      onClick={() => requestCancel(b)}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    className="delete-btn"
                    onClick={() => deleteBooking(b.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <div className="confirm-icon">✕</div>

            <h3>Cancel Booking?</h3>
            <p>
              Are you sure you want to cancel consultation with <br />
              <strong>{confirmCancel.lawyerName}</strong>?
            </p>

            <div className="confirm-actions">
              <button
                className="confirm-no"
                onClick={() => setConfirmCancel(null)}
              >
                No, Keep
              </button>

              <button
                className="confirm-yes"
                onClick={confirmCancelBooking}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
