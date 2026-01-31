import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/book-consultation", (req, res) => {
  console.log("📩 New booking received:");
  console.log(JSON.stringify(req.body, null, 2));

  return res.status(200).json({ success: true, message: "Booking received" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
