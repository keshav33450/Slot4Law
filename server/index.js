// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Use env variables
const PORT = process.env.PORT || 5000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// basic health
app.get("/", (req, res) => res.json({ message: "LegalMeet API Server is running" }));

/**
 * Simple /api/book-consultation endpoint.
 * Accepts payload: { lawyer: { name, email, ... }, booking: { firstName,..., date, time } }
 * If emails are present, sends email to lawyer and client via nodemailer.
 */

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️ EMAIL_USER or EMAIL_PASS not set. Emails will not be sent.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// helper to send email (two separate functions)
async function sendBookingEmailToLawyer(bookingData) {
  const mailOptions = {
    from: EMAIL_USER,
    to: bookingData.lawyerEmail,
    subject: `New Consultation Booking - ${bookingData.userFirstName} ${bookingData.userLastName}`,
    html: buildLawyerHtml(bookingData),
  };
  const info = await transporter.sendMail(mailOptions);
  return info;
}

async function sendConfirmationEmailToClient(bookingData) {
  const mailOptions = {
    from: EMAIL_USER,
    to: bookingData.userEmail,
    subject: `Consultation Booking Confirmed with ${bookingData.lawyerName}`,
    html: buildClientHtml(bookingData),
  };
  const info = await transporter.sendMail(mailOptions);
  return info;
}

function buildLawyerHtml(b) {
  return `
  <!doctype html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>New Consultation Booking</h2>
      <p><strong>Client:</strong> ${b.userFirstName} ${b.userLastName}</p>
      <p><strong>Email:</strong> ${b.userEmail}</p>
      <p><strong>Phone:</strong> ${b.userPhone}</p>
      <p><strong>Date:</strong> ${b.bookingDate}</p>
      <p><strong>Time:</strong> ${b.bookingTime}</p>
      <h4>Legal Matter</h4>
      <p><strong>Matter:</strong> ${b.legalMatter}</p>
      <p><strong>Type:</strong> ${b.matterType}</p>
      <p><strong>Case Type:</strong> ${b.caseType}</p>
      <p><strong>Summary:</strong> ${b.caseSummary || "Not provided"}</p>
      <hr/>
      <p>This request came from LegalMeet.</p>
    </body>
  </html>
  `;
}

function buildClientHtml(b) {
  return `
  <!doctype html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <h2>Booking Confirmed</h2>
      <p>Hi ${b.userFirstName},</p>
      <p>Your consultation booking with <strong>${b.lawyerName}</strong> is received.</p>
      <p><strong>Date:</strong> ${b.bookingDate}</p>
      <p><strong>Time:</strong> ${b.bookingTime}</p>
      <p>Please wait for confirmation from the lawyer.</p>
      <hr/>
      <p>Thank you — LegalMeet.</p>
    </body>
  </html>
  `;
}

// Booking endpoint
app.post("/api/book-consultation", async (req, res) => {
  try {
    // Support both flat and nested payloads:
    // 1) { lawyer: {...}, booking: {...} }  (preferred)
    // 2) older format { lawyer: {...}, userDetails: {...}, selectedDate, selectedTime } - attempt to normalize
    const body = req.body || {};
    console.log("📥 /api/book-consultation payload:", JSON.stringify(body, null, 2));

    let lawyer = body.lawyer || {};
    let booking = body.booking || null;

    if (!booking) {
      // try to compose booking from other keys (backwards compat)
      booking = {
        firstName: body.userDetails?.firstName || body.firstName || body.userFirstName || "",
        lastName: body.userDetails?.lastName || body.lastName || body.userLastName || "",
        email: body.userDetails?.email || body.email || body.userEmail || "",
        phone: body.userDetails?.phone || body.phone || body.userPhone || "",
        phoneFull: (body.userDetails?.phone && body.userDetails?.phoneCode) ? `${body.userDetails.phoneCode} ${body.userDetails.phone}` : (body.phoneFull || ""),
        date: body.selectedDate || body.date || "",
        time: body.selectedTime || body.time || "",
        timezone: body.timezone || "India Standard Time",
        legalMatter: body.legalMatter || (body.legalMatter && body.legalMatter.matter) || "",
        typeOfMatter: body.legalMatter?.type || body.typeOfMatter || "",
        caseType: body.legalMatter?.caseType || body.caseType || "",
        caseSummary: body.legalMatter?.summary || body.caseSummary || "",
      };
    }

    const bookingData = {
      lawyerEmail: lawyer?.email || "",
      lawyerName: lawyer?.name || (lawyer?.fullName) || "Unknown Lawyer",
      userFirstName: booking?.firstName || "",
      userLastName: booking?.lastName || "",
      userEmail: booking?.email || "",
      userPhone: booking?.phoneFull || booking?.phone || "",
      bookingDate: booking?.date || "",
      bookingTime: booking?.time || "",
      timezone: booking?.timezone || "India Standard Time",
      legalMatter: booking?.legalMatter || "",
      matterType: booking?.typeOfMatter || booking?.type || "",
      caseType: booking?.caseType || "",
      caseSummary: booking?.caseSummary || "",
    };

    // Basic validation
    if (!bookingData.lawyerEmail || !bookingData.userEmail) {
      console.warn("Missing lawyer or user email in bookingData:", bookingData);
      return res.status(400).json({ success: false, message: "Missing required email addresses (lawyer or user)." });
    }

    // Send emails
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn("Email credentials not configured; skipping sending emails.");
      return res.status(200).json({ success: true, message: "Booking received (email sending skipped in dev)." });
    }

    console.log(`Sending emails to lawyer (${bookingData.lawyerEmail}) and client (${bookingData.userEmail})`);
    await sendBookingEmailToLawyer(bookingData);
    await sendConfirmationEmailToClient(bookingData);

    console.log("✅ Booking emails sent.");
    return res.status(200).json({ success: true, message: "Booking confirmed and notifications sent successfully." });

  } catch (err) {
    console.error("❌ Booking error:", err);
    return res.status(500).json({ success: false, message: "Failed to process booking", error: err.message });
  }
});

// optional bookings retrieval endpoint (dummy, returns empty array unless you implement DB)
app.get("/api/bookings/:id", (req, res) => {
  const id = req.params.id;
  // If you have a DB, return booked slots for the lawyer id/email
  // For now return empty bookings to avoid blocking the frontend
  console.log("Request for bookings for:", id);
  res.json({ success: true, bookings: [] });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📧 Email configured: ${EMAIL_USER ? "yes" : "no"}`);
});
