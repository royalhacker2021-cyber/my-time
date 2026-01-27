const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PASSWORD = "Dhir@123";
const MONGO_URI = process.env.MONGO_URI;
const STREAK_THRESHOLD = 0.6; // 60%

// ===== DB =====
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// ===== SCHEMAS =====
const TimetableSchema = new mongoose.Schema({
  date: { type: String, index: true },
  hour: String,
  text: String,
  completed: { type: Boolean, default: false }
});
const Timetable = mongoose.model("Timetable", TimetableSchema);

// ===== AUTH =====
app.post("/login", (req, res) => {
  if (!req.body?.password) return res.status(400).json({ error: "Password missing" });
  if (req.body.password === PASSWORD) return res.json({ success: true });
  res.status(401).json({ error: "Wrong password" });
});

// ===== TIMETABLE =====
app.get("/timetable", async (req, res) => {
  const { date } = req.query;
  const data = await Timetable.find({ date });
  res.json(data);
});

app.post("/timetable", async (req, res) => {
  const { date, blocks } = req.body;
  if (!date || !Array.isArray(blocks)) return res.status(400).json({ error: "Invalid data" });

  await Timetable.deleteMany({ date });

  const clean = blocks.map(b => ({
    date,
    hour: b.hour,
    text: b.text || "",
    completed: !!b.completed
  }));

  if (clean.length) await Timetable.insertMany(clean);
  res.json({ success: true });
});
// ===== HISTORY =====
app.get("/history", async (req, res) => {
  const data = await Timetable.find({ completed: true })
    .sort({ date: -1 });
  res.json(data);
});

// ===== WEEKLY =====
app.get("/weekly-report", async (req, res) => {
  const { start, end } = req.query;
  const data = await Timetable.find({ date: { $gte: start, $lte: end } });
  res.json(data);
});

// ===== 🔥 STREAK API =====
app.get("/streak", async (req, res) => {
  const all = await Timetable.find().sort({ date: 1 });

  const byDate = {};
  all.forEach(b => {
    if (!byDate[b.date]) byDate[b.date] = [];
    byDate[b.date].push(b);
  });

  const dates = Object.keys(byDate).sort();
  let current = 0;
  let best = 0;

  for (let i = 0; i < dates.length; i++) {
    const blocks = byDate[dates[i]];
    const total = blocks.length;
    const done = blocks.filter(b => b.completed).length;

    if (total > 0 && done / total >= STREAK_THRESHOLD) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  res.json({ current, best });
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
