const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PASSWORD = "Dhir@123";
const MONGO_URI = process.env.MONGO_URI;

// ===== DB =====
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// ===== SCHEMAS =====

// TASKS
const TaskSchema = new mongoose.Schema({
  text: String,
  completed: { type: Boolean, default: false },
  date: String,
  createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model("Task", TaskSchema);

// TIMETABLE (FINAL)
const TimetableSchema = new mongoose.Schema({
  date: { type: String, index: true },
  hour: String,              // "300-360"
  text: String,
  completed: { type: Boolean, default: false }
});
const Timetable = mongoose.model("Timetable", TimetableSchema);

// ===== AUTH =====
app.post("/login", (req, res) => {
  if (!req.body?.password) {
    return res.status(400).json({ error: "Password missing" });
  }
  if (req.body.password === PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Wrong password" });
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

// Get timetable for a date
app.get("/timetable", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.json([]);
  const data = await Timetable.find({ date });
  res.json(data);
});

// Save timetable (overwrite per date)
app.post("/timetable", async (req, res) => {
  const { date, blocks } = req.body;
  if (!date || !Array.isArray(blocks)) {
    return res.status(400).json({ error: "Invalid data" });
  }

  await Timetable.deleteMany({ date });

  const clean = blocks.map(b => ({
    date,
    hour: b.hour,
    text: b.text || "",
    completed: !!b.completed
  }));

  if (clean.length) {
    await Timetable.insertMany(clean);
  }

  res.json({ success: true });
});

// ===== WEEKLY REPORT (MONDAY–SUNDAY) =====
app.get("/weekly-report", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.json([]);

  const data = await Timetable.find({
    date: { $gte: start, $lte: end }
  });

  res.json(data);
});

// ===== SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
