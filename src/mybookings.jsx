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

  // modal state
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", uid)
      );
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

  // ✅ Check if booking is in the past (date + time)
  const isBookingPast = (date, time) => {
    try {
      if (!date || !time) return false;

      const [year, month, day] = date.split("-").map(Number);

      let raw = time.trim();
      let [h, m] = raw.split(":").map(Number);

      if (h >= 1 && h <= 7) {
        h += 12;
      }

      const bookingDateTime = new Date(year, month - 1, day, h, m || 0);
      const now = new Date();

      return bookingDateTime < now;
    } catch (err) {
      console.error("Error parsing date/time:", err);
      return false;
    }
  };

  const requestCancel = (booking) => {
    setConfirmCancel({
      bookingId: booking.id,
      lawyerName: booking.lawyerName
    });
  };

  const requestDelete = (booking) => {
    setConfirmDelete({
      bookingId: booking.id,
      lawyerName: booking.lawyerName
    });
  };

  const confirmCancelBooking = async () => {
    if (!confirmCancel) return;

    try {
      await deleteDoc(doc(db, "bookings", confirmCancel.bookingId));
      setBookings((prev) =>
        prev.filter((b) => b.id !== confirmCancel.bookingId)
      );
    } catch (err) {
      console.error("Cancel failed", err);
    } finally {
      setConfirmCancel(null);
    }
  };

  const confirmDeleteBooking = async () => {
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "bookings", confirmDelete.bookingId));
      setBookings((prev) =>
        prev.filter((b) => b.id !== confirmDelete.bookingId)
      );
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setConfirmDelete(null);
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
                  <button
                    className="cancel-btn"
                    onClick={() => requestCancel(b)}
                    disabled={isPast}
                    title={isPast ? "Cannot cancel past bookings" : "Cancel booking"}
                  >
                    {isPast ? "Completed" : "Cancel"}
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => requestDelete(b)}
                    title="Delete booking from history"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {confirmCancel && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <div className="confirm-icon">✕</div>

            <h3>Cancel Booking?</h3>
            <p>
              Are you sure you want to cancel your consultation with <br />
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

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <div className="confirm-icon delete-icon">🗑</div>

            <h3>Delete Booking?</h3>
            <p>
              Are you sure you want to permanently delete this booking with <br />
              <strong>{confirmDelete.lawyerName}</strong>?
            </p>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              This action cannot be undone.
            </p>

            <div className="confirm-actions">
              <button
                className="confirm-no"
                onClick={() => setConfirmDelete(null)}
              >
                No, Keep
              </button>

              <button
                className="confirm-delete"
                onClick={confirmDeleteBooking}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
