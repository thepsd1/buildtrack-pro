const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { Project, Worker, Task, Material, DailyLog, Attendance, Issue } = require('./models');

// Map table name → Mongoose model
const models = {
  projects:   Project,
  workers:    Worker,
  tasks:      Task,
  materials:  Material,
  daily_logs: DailyLog,
  attendance: Attendance,
  issues:     Issue,
};

// ── Connect to MongoDB ────────────────────────────────────
async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not set!');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');
}

// ── Async DB API (same interface as JSON version) ─────────
const db = {
  async getAll(table, filters = {}) {
    const Model = models[table];
    // Remove empty/null/undefined filter values
    const clean = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') clean[k] = v;
    });
    return Model.find(clean).lean();
  },

  async getById(table, id) {
    return models[table].findOne({ id }).lean();
  },

  async insert(table, record) {
    if (!record.id) record.id = uuidv4();
    if (!record.createdAt) record.createdAt = new Date().toISOString();
    const doc = await models[table].create(record);
    return doc.toObject();
  },

  async update(table, id, data) {
    const doc = await models[table].findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    ).lean();
    return doc;
  },

  async delete(table, id) {
    await models[table].deleteOne({ id });
    return true;
  },

  async deleteWhere(table, field, value) {
    await models[table].deleteMany({ [field]: value });
  },

  async count(table, filters = {}) {
    const clean = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') clean[k] = v;
    });
    return models[table].countDocuments(clean);
  },

  async upsertAttendance(record) {
    if (!record.id) record.id = uuidv4();
    if (!record.createdAt) record.createdAt = new Date().toISOString();
    await Attendance.findOneAndUpdate(
      { workerId: record.workerId, date: record.date },
      { $set: record },
      { upsert: true, new: true }
    );
  }
};

// ── Seed demo data if DB is empty ─────────────────────────
async function seed() {
  const count = await Project.countDocuments();
  if (count > 0) return;

  console.log('🌱 Seeding demo data...');
  const p1 = uuidv4(), p2 = uuidv4(), p3 = uuidv4();
  const w1 = uuidv4(), w2 = uuidv4(), w3 = uuidv4(), w4 = uuidv4(), w5 = uuidv4(), w6 = uuidv4();

  await Project.insertMany([
    { id: p1, name: 'Skyline Tower Construction', location: 'Mumbai, Maharashtra', client: 'Skyline Developers Pvt Ltd', description: 'Construction of a 25-story residential tower with modern amenities.', startDate: '2026-01-15', endDate: '2027-06-30', budget: 45000000, status: 'active' },
    { id: p2, name: 'Green Valley Highway Bridge', location: 'Pune, Maharashtra', client: 'National Highways Authority', description: 'Construction of a 200m reinforced concrete bridge spanning Green Valley.', startDate: '2026-02-01', endDate: '2026-12-31', budget: 18000000, status: 'active' },
    { id: p3, name: 'Metro Station Expansion', location: 'Delhi NCR', client: 'Delhi Metro Rail Corp', description: 'Expanding the Blue Line metro station with two additional platforms.', startDate: '2025-11-01', endDate: '2026-08-15', budget: 32000000, status: 'on-hold' },
  ]);

  await Worker.insertMany([
    { id: w1, name: 'Rajesh Kumar',  role: 'Site Engineer',   phone: '9876543210', email: 'rajesh@example.com',  hourlyRate: 850, status: 'active' },
    { id: w2, name: 'Amit Sharma',   role: 'Mason',           phone: '9876543211', email: 'amit@example.com',    hourlyRate: 600, status: 'active' },
    { id: w3, name: 'Priya Patel',   role: 'Safety Officer',  phone: '9876543212', email: 'priya@example.com',   hourlyRate: 750, status: 'active' },
    { id: w4, name: 'Suresh Yadav',  role: 'Electrician',     phone: '9876543213', email: 'suresh@example.com',  hourlyRate: 700, status: 'active' },
    { id: w5, name: 'Deepak Singh',  role: 'Carpenter',       phone: '9876543214', email: 'deepak@example.com',  hourlyRate: 650, status: 'active' },
    { id: w6, name: 'Anita Verma',   role: 'Architect',       phone: '9876543215', email: 'anita@example.com',   hourlyRate: 950, status: 'active' },
  ]);

  await Task.insertMany([
    { id: uuidv4(), projectId: p1, title: 'Foundation excavation',          description: 'Complete excavation for Zone A',       assignedTo: w1, status: 'completed',   priority: 'high',     dueDate: '2026-02-15', completedAt: '2026-02-14T10:00:00Z' },
    { id: uuidv4(), projectId: p1, title: 'Rebar installation - Ground floor', description: 'Install reinforcement bars for slab', assignedTo: w2, status: 'in-progress', priority: 'high',     dueDate: '2026-04-20' },
    { id: uuidv4(), projectId: p1, title: 'Electrical conduit layout',      description: 'Install conduit system for floors 1-5', assignedTo: w4, status: 'pending',     priority: 'medium',   dueDate: '2026-05-10' },
    { id: uuidv4(), projectId: p2, title: 'Pile foundation drilling',       description: 'Drill piles for bridge piers P1-P4',    assignedTo: w1, status: 'in-progress', priority: 'critical', dueDate: '2026-04-30' },
    { id: uuidv4(), projectId: p2, title: 'Safety barrier installation',    description: 'Install temporary safety barriers',     assignedTo: w3, status: 'completed',   priority: 'high',     dueDate: '2026-03-15', completedAt: '2026-03-14T16:00:00Z' },
    { id: uuidv4(), projectId: p3, title: 'Demolition of platform edge',    description: 'Demolish existing platform walls',      assignedTo: w5, status: 'blocked',     priority: 'high',     dueDate: '2026-05-01' },
  ]);

  await Material.insertMany([
    { id: uuidv4(), projectId: p1, name: 'TMT Steel Bars (12mm)',    quantity: 500, unit: 'tons',         unitCost: 52000, supplier: 'Tata Steel',    status: 'delivered', requestedBy: 'Rajesh Kumar', requestDate: '2026-01-20', deliveryDate: '2026-02-10' },
    { id: uuidv4(), projectId: p1, name: 'Portland Cement (OPC 53)', quantity: 2000, unit: 'bags',        unitCost: 380,   supplier: 'UltraTech',     status: 'ordered',   requestedBy: 'Rajesh Kumar', requestDate: '2026-03-01' },
    { id: uuidv4(), projectId: p1, name: 'River Sand',               quantity: 300, unit: 'cubic meters', unitCost: 1800,  supplier: 'Local Supplier', status: 'requested', requestedBy: 'Amit Sharma',  requestDate: '2026-04-01' },
    { id: uuidv4(), projectId: p2, name: 'Concrete Mix M40',         quantity: 800, unit: 'cubic meters', unitCost: 5500,  supplier: 'RMC India',     status: 'approved',  requestedBy: 'Rajesh Kumar', requestDate: '2026-02-15' },
    { id: uuidv4(), projectId: p2, name: 'Structural Steel Plates',  quantity: 150, unit: 'tons',         unitCost: 65000, supplier: 'SAIL',          status: 'requested', requestedBy: 'Priya Patel',  requestDate: '2026-03-20' },
  ]);

  await DailyLog.insertMany([
    { id: uuidv4(), projectId: p1, date: '2026-04-04', weather: 'Sunny',         temperature: '34°C', workSummary: 'Completed rebar work on ground floor section B. Concrete pouring started for section A.',      workforceCount: 42, hoursWorked: 8.5, equipmentUsed: 'Tower Crane, Concrete Mixer', safetyIncidents: 0, notes: 'Good progress.', createdBy: 'Rajesh Kumar' },
    { id: uuidv4(), projectId: p1, date: '2026-04-05', weather: 'Partly Cloudy', temperature: '31°C', workSummary: 'Continued concrete pouring. Formwork preparation for first floor. Safety audit completed.',    workforceCount: 38, hoursWorked: 7,   equipmentUsed: 'Tower Crane, Concrete Pump',  safetyIncidents: 0, notes: 'Minor pump delay.', createdBy: 'Rajesh Kumar' },
    { id: uuidv4(), projectId: p2, date: '2026-04-05', weather: 'Clear',         temperature: '29°C', workSummary: 'Pile drilling completed for P2. Started P3 pile work. Traffic management zone extended.',      workforceCount: 25, hoursWorked: 9,   equipmentUsed: 'Piling Rig, Excavator',       safetyIncidents: 0, notes: 'Ahead of schedule.', createdBy: 'Priya Patel' },
  ]);

  const today = new Date().toISOString().split('T')[0];
  await Attendance.insertMany([
    { id: uuidv4(), workerId: w1, projectId: p1, date: today, status: 'present',  checkIn: '08:00', checkOut: '17:00', hoursWorked: 9,   notes: '' },
    { id: uuidv4(), workerId: w2, projectId: p1, date: today, status: 'present',  checkIn: '08:30', checkOut: '17:30', hoursWorked: 9,   notes: '' },
    { id: uuidv4(), workerId: w3, projectId: p2, date: today, status: 'present',  checkIn: '07:45', checkOut: '16:45', hoursWorked: 9,   notes: '' },
    { id: uuidv4(), workerId: w4, projectId: p1, date: today, status: 'late',     checkIn: '09:30', checkOut: '17:00', hoursWorked: 7.5, notes: 'Traffic delay' },
    { id: uuidv4(), workerId: w5, projectId: p3, date: today, status: 'absent',   checkIn: null,    checkOut: null,    hoursWorked: 0,   notes: 'Medical leave' },
    { id: uuidv4(), workerId: w6, projectId: p1, date: today, status: 'present',  checkIn: '08:00', checkOut: '18:00', hoursWorked: 10,  notes: 'Overtime' },
  ]);

  await Issue.insertMany([
    { id: uuidv4(), projectId: p1, title: 'Water seepage in basement', description: 'Water seepage detected in basement level 2 near stairwell.', severity: 'high',     status: 'open',        reportedBy: 'Priya Patel',  reportDate: '2026-04-03' },
    { id: uuidv4(), projectId: p1, title: 'Crack in column C4',       description: 'Hairline crack observed in column C4 on ground floor.',      severity: 'critical', status: 'in-progress', reportedBy: 'Rajesh Kumar', assignedTo: 'Anita Verma', reportDate: '2026-04-02' },
    { id: uuidv4(), projectId: p2, title: 'Missing safety signage',   description: 'Safety signs not installed at bridge approach eastern side.', severity: 'medium',   status: 'resolved',    reportedBy: 'Priya Patel',  resolution: 'Signs installed on 2026-04-03', reportDate: '2026-04-01', resolvedDate: '2026-04-03' },
  ]);

  console.log('✅ Demo data seeded to MongoDB');
}

module.exports = { db, connect, seed };
