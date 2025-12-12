// server.js
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Simple route that just logs and succeeds
app.post("/api/book-consultation", (req, res) => {
  console.log("📩 New booking received:");
  console.log(JSON.stringify(req.body, null, 2));

  // You can later add email/WhatsApp sending here.

  return res.status(200).json({ success: true, message: "Booking received" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
