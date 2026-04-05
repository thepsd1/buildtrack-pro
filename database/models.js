const mongoose = require('mongoose');

const { Schema } = mongoose;

// ── Projects ──────────────────────────────────────────────
const projectSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  location:    String,
  client:      String,
  description: String,
  startDate:   String,
  endDate:     String,
  budget:      { type: Number, default: 0 },
  status:      { type: String, default: 'active', enum: ['active','on-hold','completed','cancelled'] },
  createdAt:   { type: String, default: () => new Date().toISOString() }
});

// ── Workers ───────────────────────────────────────────────
const workerSchema = new Schema({
  id:         { type: String, required: true, unique: true },
  name:       { type: String, required: true },
  role:       { type: String, required: true },
  phone:      String,
  email:      String,
  dailyRate:  { type: Number, default: 0 },
  status:     { type: String, default: 'active', enum: ['active','inactive'] },
  createdAt:  { type: String, default: () => new Date().toISOString() }
});

// ── Tasks ─────────────────────────────────────────────────
const taskSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  projectId:   { type: String, required: true },
  title:       { type: String, required: true },
  description: String,
  assignedTo:  String,
  status:      { type: String, default: 'pending', enum: ['pending','in-progress','completed','blocked'] },
  priority:    { type: String, default: 'medium', enum: ['low','medium','high','critical'] },
  dueDate:     String,
  completedAt: String,
  createdAt:   { type: String, default: () => new Date().toISOString() }
});

// ── Materials ─────────────────────────────────────────────
const materialSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  projectId:   { type: String, required: true },
  name:        { type: String, required: true },
  quantity:    { type: Number, required: true },
  unit:        { type: String, required: true },
  unitCost:    { type: Number, default: 0 },
  supplier:    String,
  status:      { type: String, default: 'requested', enum: ['requested','approved','ordered','delivered','used'] },
  requestedBy: String,
  requestDate: String,
  deliveryDate:String,
  notes:       String,
  createdAt:   { type: String, default: () => new Date().toISOString() }
});

// ── Daily Logs ────────────────────────────────────────────
const dailyLogSchema = new Schema({
  id:              { type: String, required: true, unique: true },
  projectId:       { type: String, required: true },
  date:            { type: String, required: true },
  weather:         String,
  temperature:     String,
  workSummary:     { type: String, required: true },
  workforceCount:  { type: Number, default: 0 },
  hoursWorked:     { type: Number, default: 0 },
  equipmentUsed:   String,
  safetyIncidents: { type: Number, default: 0 },
  notes:           String,
  createdBy:       String,
  createdAt:       { type: String, default: () => new Date().toISOString() }
});

// ── Attendance ────────────────────────────────────────────
const attendanceSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  workerId:    { type: String, required: true },
  projectId:   { type: String, required: true },
  date:        { type: String, required: true },
  status:      { type: String, default: 'present', enum: ['present','absent','half-day','late'] },
  checkIn:     String,
  checkOut:    String,
  hoursWorked: { type: Number, default: 0 },
  notes:       { type: String, default: '' },
  createdAt:   { type: String, default: () => new Date().toISOString() }
});

// ── Issues ────────────────────────────────────────────────
const issueSchema = new Schema({
  id:           { type: String, required: true, unique: true },
  projectId:    { type: String, required: true },
  title:        { type: String, required: true },
  description:  String,
  severity:     { type: String, default: 'medium', enum: ['low','medium','high','critical'] },
  status:       { type: String, default: 'open', enum: ['open','in-progress','resolved','closed'] },
  reportedBy:   String,
  assignedTo:   String,
  photoUrl:     String,
  resolution:   String,
  reportDate:   String,
  resolvedDate: String,
  createdAt:    { type: String, default: () => new Date().toISOString() }
});

module.exports = {
  Project:    mongoose.model('Project',    projectSchema),
  Worker:     mongoose.model('Worker',     workerSchema),
  Task:       mongoose.model('Task',       taskSchema),
  Material:   mongoose.model('Material',   materialSchema),
  DailyLog:   mongoose.model('DailyLog',   dailyLogSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Issue:      mongoose.model('Issue',      issueSchema),
};
