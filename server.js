const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PASSWORD = "Dhir@123";
const MONGO_URI = process.env.MONGO_URI;

// ===== DB CONNECT =====
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

// ===== SCHEMAS =====

// TASKS
const TaskSchema = new mongoose.Schema({
  text: String,
  completed: { type: Boolean, default: false },
  date: String,
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", TaskSchema);

// TIMETABLE (CRITICAL FIX)
const TimetableSchema = new mongoose.Schema({
  date: { type: String, index: true },
  key: String,        // stable key like "300-360"
  text: String
});

const Timetable = mongoose.model("Timetable", TimetableSchema);

// ===== AUTH =====
app.post("/login", (req, res) => {
  if (!req.body || !req.body.password) {
    return res.status(400).json({ error: "Password missing" });
  }

  if (req.body.password === PASSWORD) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ error: "Wrong password" });
  }
});

// ===== TASK APIs =====
app.get("/tasks", async (req, res) => {
  const { date } = req.query;
  const tasks = await Task.find({ date, completed: false });
  res.json(tasks);
});

app.get("/history", async (req, res) => {
  const tasks = await Task.find({ completed: true }).sort({ createdAt: -1 });
  res.json(tasks);
});

app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

app.put("/tasks/:id", async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

// ===== TIMETABLE APIs =====

// GET timetable for a date
app.get("/timetable", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.json([]);

  const blocks = await Timetable.find({ date });
  res.json(blocks);
});

// SAVE timetable for a date (FULL OVERWRITE)
app.post("/timetable", async (req, res) => {
  try {
    const { date, blocks } = req.body;

    if (!date || !Array.isArray(blocks)) {
      return res.status(400).json({ error: "Invalid timetable data" });
    }

    // 1. Delete existing timetable for that date
    await Timetable.deleteMany({ date });

    // 2. Insert clean blocks (date enforced here)
    const cleanBlocks = blocks.map(b => ({
      date,
      key: b.hour,   // stable key like "300-360"
      text: b.text || ""
    }));

    if (cleanBlocks.length > 0) {
      await Timetable.insertMany(cleanBlocks);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Timetable save error:", err);
    res.status(500).json({ error: "Failed to save timetable" });
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
