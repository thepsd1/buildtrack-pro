const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// ── Determine storage mode ────────────────────────────────
const USE_MONGO = !!process.env.MONGODB_URI;

// ── JSON fallback store (used when MongoDB is not configured) ──
const DB_PATH = path.join(__dirname, 'data.json');
let store = { projects: [], workers: [], tasks: [], materials: [], daily_logs: [], attendance: [], issues: [] };

function loadJSON() {
  try { if (fs.existsSync(DB_PATH)) store = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch (e) {}
}
function saveJSON() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2)); } catch (e) {}
}

// ── Mongoose models (only loaded when using MongoDB) ──────
let models = {};
let Attendance;
if (USE_MONGO) {
  const m = require('./models');
  models = { projects: m.Project, workers: m.Worker, tasks: m.Task, materials: m.Material, daily_logs: m.DailyLog, attendance: m.Attendance, issues: m.Issue };
  Attendance = m.Attendance;
}

// ── Connect to MongoDB ────────────────────────────────────
async function connect() {
  if (!USE_MONGO) {
    loadJSON();
    console.log('💾 Running with local JSON storage (no MONGODB_URI set)');
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');
}

// ── Unified Async DB API ──────────────────────────────────
const db = {
  async getAll(table, filters = {}) {
    const clean = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') clean[k] = v; });

    if (USE_MONGO) return models[table].find(clean).lean();

    let rows = [...(store[table] || [])];
    Object.entries(clean).forEach(([k, v]) => { rows = rows.filter(r => r[k] === v); });
    return rows;
  },

  async getById(table, id) {
    if (USE_MONGO) return models[table].findOne({ id }).lean();
    return (store[table] || []).find(r => r.id === id) || null;
  },

  async insert(table, record) {
    if (!record.id) record.id = uuidv4();
    if (!record.createdAt) record.createdAt = new Date().toISOString();

    if (USE_MONGO) { const doc = await models[table].create(record); return doc.toObject(); }

    store[table].push(record); saveJSON(); return record;
  },

  async update(table, id, data) {
    if (USE_MONGO) return models[table].findOneAndUpdate({ id }, { $set: data }, { new: true }).lean();

    const idx = store[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    store[table][idx] = { ...store[table][idx], ...data };
    saveJSON(); return store[table][idx];
  },

  async delete(table, id) {
    if (USE_MONGO) { await models[table].deleteOne({ id }); return true; }
    store[table] = store[table].filter(r => r.id !== id); saveJSON(); return true;
  },

  async deleteWhere(table, field, value) {
    if (USE_MONGO) { await models[table].deleteMany({ [field]: value }); return; }
    store[table] = store[table].filter(r => r[field] !== value); saveJSON();
  },

  async count(table, filters = {}) {
    return (await this.getAll(table, filters)).length;
  },

  async upsertAttendance(record) {
    if (!record.id) record.id = uuidv4();
    if (!record.createdAt) record.createdAt = new Date().toISOString();

    if (USE_MONGO) {
      await Attendance.findOneAndUpdate(
        { workerId: record.workerId, date: record.date },
        { $set: record },
        { upsert: true, new: true }
      );
      return;
    }

    const idx = store.attendance.findIndex(r => r.workerId === record.workerId && r.date === record.date);
    if (idx !== -1) store.attendance[idx] = { ...store.attendance[idx], ...record };
    else store.attendance.push(record);
    saveJSON();
  }
};

// ── Seed demo data if DB is empty ─────────────────────────
async function seed() {
  const existing = await db.getAll('projects');
  if (existing.length > 0) return;

  console.log('🌱 Seeding demo data...');
  const p1 = uuidv4(), p2 = uuidv4(), p3 = uuidv4();
  const w1 = uuidv4(), w2 = uuidv4(), w3 = uuidv4(), w4 = uuidv4(), w5 = uuidv4(), w6 = uuidv4();

  const projects = [
    { id: p1, name: 'Skyline Tower Construction',  location: 'Mumbai, Maharashtra', client: 'Skyline Developers Pvt Ltd', description: 'Construction of a 25-story residential tower with modern amenities.', startDate: '2026-01-15', endDate: '2027-06-30', budget: 45000000, status: 'active' },
    { id: p2, name: 'Green Valley Highway Bridge', location: 'Pune, Maharashtra',   client: 'National Highways Authority', description: 'Construction of a 200m reinforced concrete bridge spanning Green Valley.', startDate: '2026-02-01', endDate: '2026-12-31', budget: 18000000, status: 'active' },
    { id: p3, name: 'Metro Station Expansion',     location: 'Delhi NCR',           client: 'Delhi Metro Rail Corp', description: 'Expanding the Blue Line metro station with two additional platforms.', startDate: '2025-11-01', endDate: '2026-08-15', budget: 32000000, status: 'on-hold' },
  ];
  const workers = [
    { id: w1, name: 'Rajesh Kumar', role: 'Site Engineer',  phone: '9876543210', email: 'rajesh@example.com', dailyRate: 2500, status: 'active' },
    { id: w2, name: 'Amit Sharma',  role: 'Mason',          phone: '9876543211', email: 'amit@example.com',   dailyRate: 800,  status: 'active' },
    { id: w3, name: 'Priya Patel',  role: 'Safety Officer', phone: '9876543212', email: 'priya@example.com',  dailyRate: 1800, status: 'active' },
    { id: w4, name: 'Suresh Yadav', role: 'Electrician',    phone: '9876543213', email: 'suresh@example.com', dailyRate: 1200, status: 'active' },
    { id: w5, name: 'Deepak Singh', role: 'Carpenter',      phone: '9876543214', email: 'deepak@example.com', dailyRate: 900,  status: 'active' },
    { id: w6, name: 'Anita Verma',  role: 'Architect',      phone: '9876543215', email: 'anita@example.com',  dailyRate: 3500, status: 'active' },
  ];
  const tasks = [
    { id: uuidv4(), projectId: p1, title: 'Foundation excavation',           description: 'Complete excavation for Zone A',        assignedTo: w1, status: 'completed',   priority: 'high',     dueDate: '2026-02-15', completedAt: '2026-02-14T10:00:00Z' },
    { id: uuidv4(), projectId: p1, title: 'Rebar installation - Ground floor',description: 'Install reinforcement bars for slab',  assignedTo: w2, status: 'in-progress', priority: 'high',     dueDate: '2026-04-20' },
    { id: uuidv4(), projectId: p1, title: 'Electrical conduit layout',       description: 'Install conduit system for floors 1-5', assignedTo: w4, status: 'pending',     priority: 'medium',   dueDate: '2026-05-10' },
    { id: uuidv4(), projectId: p2, title: 'Pile foundation drilling',        description: 'Drill piles for bridge piers P1-P4',    assignedTo: w1, status: 'in-progress', priority: 'critical', dueDate: '2026-04-30' },
    { id: uuidv4(), projectId: p2, title: 'Safety barrier installation',     description: 'Install temporary safety barriers',     assignedTo: w3, status: 'completed',   priority: 'high',     dueDate: '2026-03-15', completedAt: '2026-03-14T16:00:00Z' },
    { id: uuidv4(), projectId: p3, title: 'Demolition of platform edge',     description: 'Demolish existing platform walls',      assignedTo: w5, status: 'blocked',     priority: 'high',     dueDate: '2026-05-01' },
  ];
  const materials = [
    { id: uuidv4(), projectId: p1, name: 'TMT Steel Bars (12mm)',    quantity: 500,  unit: 'tons',         unitCost: 52000, supplier: 'Tata Steel',    status: 'delivered', requestedBy: 'Rajesh Kumar', requestDate: '2026-01-20', deliveryDate: '2026-02-10' },
    { id: uuidv4(), projectId: p1, name: 'Portland Cement (OPC 53)', quantity: 2000, unit: 'bags',         unitCost: 380,   supplier: 'UltraTech',     status: 'ordered',   requestedBy: 'Rajesh Kumar', requestDate: '2026-03-01' },
    { id: uuidv4(), projectId: p1, name: 'River Sand',               quantity: 300,  unit: 'cubic meters', unitCost: 1800,  supplier: 'Local Supplier', status: 'requested', requestedBy: 'Amit Sharma',  requestDate: '2026-04-01' },
    { id: uuidv4(), projectId: p2, name: 'Concrete Mix M40',         quantity: 800,  unit: 'cubic meters', unitCost: 5500,  supplier: 'RMC India',     status: 'approved',  requestedBy: 'Rajesh Kumar', requestDate: '2026-02-15' },
    { id: uuidv4(), projectId: p2, name: 'Structural Steel Plates',  quantity: 150,  unit: 'tons',         unitCost: 65000, supplier: 'SAIL',          status: 'requested', requestedBy: 'Priya Patel',  requestDate: '2026-03-20' },
  ];
  const today = new Date().toISOString().split('T')[0];
  const dailyLogs = [
    { id: uuidv4(), projectId: p1, date: '2026-04-04', weather: 'Sunny',         temperature: '34°C', workSummary: 'Completed rebar work on ground floor section B. Concrete pouring started for section A.',    workforceCount: 42, hoursWorked: 8.5, equipmentUsed: 'Tower Crane, Concrete Mixer', safetyIncidents: 0, notes: 'Good progress.',   createdBy: 'Rajesh Kumar' },
    { id: uuidv4(), projectId: p1, date: '2026-04-05', weather: 'Partly Cloudy', temperature: '31°C', workSummary: 'Continued concrete pouring. Formwork preparation for first floor. Safety audit completed.', workforceCount: 38, hoursWorked: 7,   equipmentUsed: 'Tower Crane, Concrete Pump',  safetyIncidents: 0, notes: 'Minor pump delay.', createdBy: 'Rajesh Kumar' },
    { id: uuidv4(), projectId: p2, date: '2026-04-05', weather: 'Clear',         temperature: '29°C', workSummary: 'Pile drilling completed for P2. Started P3 pile work. Traffic management zone extended.',    workforceCount: 25, hoursWorked: 9,   equipmentUsed: 'Piling Rig, Excavator',       safetyIncidents: 0, notes: 'Ahead of schedule.', createdBy: 'Priya Patel' },
  ];
  const attendance = [
    { id: uuidv4(), workerId: w1, projectId: p1, date: today, status: 'present', checkIn: '08:00', checkOut: '17:00', hoursWorked: 9,   notes: '' },
    { id: uuidv4(), workerId: w2, projectId: p1, date: today, status: 'present', checkIn: '08:30', checkOut: '17:30', hoursWorked: 9,   notes: '' },
    { id: uuidv4(), workerId: w3, projectId: p2, date: today, status: 'present', checkIn: '07:45', checkOut: '16:45', hoursWorked: 9,   notes: '' },
    { id: uuidv4(), workerId: w4, projectId: p1, date: today, status: 'late',    checkIn: '09:30', checkOut: '17:00', hoursWorked: 7.5, notes: 'Traffic delay' },
    { id: uuidv4(), workerId: w5, projectId: p3, date: today, status: 'absent',  checkIn: null,    checkOut: null,    hoursWorked: 0,   notes: 'Medical leave' },
    { id: uuidv4(), workerId: w6, projectId: p1, date: today, status: 'present', checkIn: '08:00', checkOut: '18:00', hoursWorked: 10,  notes: 'Overtime' },
  ];
  const issues = [
    { id: uuidv4(), projectId: p1, title: 'Water seepage in basement', description: 'Water seepage detected in basement level 2 near stairwell.', severity: 'high',     status: 'open',        reportedBy: 'Priya Patel',  reportDate: '2026-04-03' },
    { id: uuidv4(), projectId: p1, title: 'Crack in column C4',        description: 'Hairline crack observed in column C4 on ground floor.',      severity: 'critical', status: 'in-progress', reportedBy: 'Rajesh Kumar', assignedTo: 'Anita Verma', reportDate: '2026-04-02' },
    { id: uuidv4(), projectId: p2, title: 'Missing safety signage',    description: 'Safety signs not installed at bridge approach eastern side.', severity: 'medium',   status: 'resolved',    reportedBy: 'Priya Patel',  resolution: 'Signs installed on 2026-04-03', reportDate: '2026-04-01', resolvedDate: '2026-04-03' },
  ];

  // Insert all
  for (const p of projects)   await db.insert('projects',   p);
  for (const w of workers)    await db.insert('workers',    w);
  for (const t of tasks)      await db.insert('tasks',      t);
  for (const m of materials)  await db.insert('materials',  m);
  for (const l of dailyLogs)  await db.insert('daily_logs', l);
  for (const a of attendance) await db.insert('attendance', a);
  for (const i of issues)     await db.insert('issues',     i);

  console.log(`✅ Demo data seeded (${USE_MONGO ? 'MongoDB' : 'JSON'})`);
}

module.exports = { db, connect, seed };
