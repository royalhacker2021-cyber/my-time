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

// ===== SCHEMA =====
const TaskSchema = new mongoose.Schema({
  text: String,
  completed: { type: Boolean, default: false },
  date: String,
  createdAt: { type: Date, default: Date.now }
});


const Task = mongoose.model("Task", TaskSchema);

// ===== AUTH =====
app.post("/login", (req, res) => {
  if (req.body.password === PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// ===== API =====
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

app.listen(3000, () => console.log("Server running"));
