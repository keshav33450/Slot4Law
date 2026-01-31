import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sendBookingEmail, sendClientConfirmationEmail } from "./emailService.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/health", (req, res) => {
  res.send("Backend working ✅");
});

// booking route
app.post("/api/book-consultation", async (req, res) => {
  console.log("📩 Booking received:", req.body);

  // respond immediately (never block frontend)
  res.json({ success: true });

  // send email in background
  try {
    await sendBookingEmail(req.body);
    await sendClientConfirmationEmail(req.body);
    console.log("✅ Emails sent");
  } catch (err) {
    console.error("⚠️ Email failed but booking kept:", err.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
