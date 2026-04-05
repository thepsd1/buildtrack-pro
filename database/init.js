const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data.json');

// In-memory store
let store = {
  projects: [],
  workers: [],
  tasks: [],
  materials: [],
  daily_logs: [],
  attendance: [],
  issues: []
};

// Load from file if exists
function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      store = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('DB load error:', e.message);
  }
}

// Save to file
function save() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

// Simple query helpers
const db = {
  getAll(table, filters = {}) {
    let rows = [...store[table]];
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        rows = rows.filter(r => r[key] === val);
      }
    });
    return rows;
  },

  getById(table, id) {
    return store[table].find(r => r.id === id) || null;
  },

  insert(table, record) {
    if (!record.id) record.id = uuidv4();
    if (!record.createdAt) record.createdAt = new Date().toISOString();
    store[table].push(record);
    save();
    return record;
  },

  update(table, id, data) {
    const idx = store[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    store[table][idx] = { ...store[table][idx], ...data };
    save();
    return store[table][idx];
  },

  delete(table, id) {
    const len = store[table].length;
    store[table] = store[table].filter(r => r.id !== id);
    save();
    return store[table].length < len;
  },

  // Delete by field (for cascade)
  deleteWhere(table, field, value) {
    store[table] = store[table].filter(r => r[field] !== value);
    save();
  },

  count(table, filters = {}) {
    return this.getAll(table, filters).length;
  },

  // Upsert for attendance (unique on workerId + date)
  upsertAttendance(record) {
    const idx = store.attendance.findIndex(r => r.workerId === record.workerId && r.date === record.date);
    if (idx !== -1) {
      store.attendance[idx] = { ...store.attendance[idx], ...record };
    } else {
      if (!record.id) record.id = uuidv4();
      if (!record.createdAt) record.createdAt = new Date().toISOString();
      store.attendance.push(record);
    }
    save();
  }
};

// Seed demo data if empty
function seed() {
  if (store.projects.length > 0) return;
  console.log('🌱 Seeding demo data...');

  const p1 = uuidv4(), p2 = uuidv4(), p3 = uuidv4();
  store.projects = [
    { id: p1, name: 'Skyline Tower Construction', location: 'Mumbai, Maharashtra', client: 'Skyline Developers Pvt Ltd', description: 'Construction of a 25-story residential tower with modern amenities including rooftop pool, gym, and underground parking.', startDate: '2026-01-15', endDate: '2027-06-30', budget: 45000000, status: 'active', createdAt: new Date().toISOString() },
    { id: p2, name: 'Green Valley Highway Bridge', location: 'Pune, Maharashtra', client: 'National Highways Authority', description: 'Construction of a 200m reinforced concrete bridge spanning Green Valley. Includes 4-lane roadway with pedestrian walkways.', startDate: '2026-02-01', endDate: '2026-12-31', budget: 18000000, status: 'active', createdAt: new Date().toISOString() },
    { id: p3, name: 'Metro Station Expansion', location: 'Delhi NCR', client: 'Delhi Metro Rail Corp', description: 'Expanding the existing Blue Line metro station with two additional platforms and new entry/exit gates.', startDate: '2025-11-01', endDate: '2026-08-15', budget: 32000000, status: 'on-hold', createdAt: new Date().toISOString() }
  ];

  const w1 = uuidv4(), w2 = uuidv4(), w3 = uuidv4(), w4 = uuidv4(), w5 = uuidv4(), w6 = uuidv4();
  store.workers = [
    { id: w1, name: 'Rajesh Kumar', role: 'Site Engineer', phone: '9876543210', email: 'rajesh@example.com', hourlyRate: 850, status: 'active', createdAt: new Date().toISOString() },
    { id: w2, name: 'Amit Sharma', role: 'Mason', phone: '9876543211', email: 'amit@example.com', hourlyRate: 600, status: 'active', createdAt: new Date().toISOString() },
    { id: w3, name: 'Priya Patel', role: 'Safety Officer', phone: '9876543212', email: 'priya@example.com', hourlyRate: 750, status: 'active', createdAt: new Date().toISOString() },
    { id: w4, name: 'Suresh Yadav', role: 'Electrician', phone: '9876543213', email: 'suresh@example.com', hourlyRate: 700, status: 'active', createdAt: new Date().toISOString() },
    { id: w5, name: 'Deepak Singh', role: 'Carpenter', phone: '9876543214', email: 'deepak@example.com', hourlyRate: 650, status: 'active', createdAt: new Date().toISOString() },
    { id: w6, name: 'Anita Verma', role: 'Architect', phone: '9876543215', email: 'anita@example.com', hourlyRate: 950, status: 'active', createdAt: new Date().toISOString() }
  ];

  store.tasks = [
    { id: uuidv4(), projectId: p1, title: 'Foundation excavation', description: 'Complete excavation work for building foundation - Zone A', assignedTo: w1, status: 'completed', priority: 'high', dueDate: '2026-02-15', completedAt: '2026-02-14T10:00:00Z', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p1, title: 'Rebar installation - Ground floor', description: 'Install reinforcement bars for ground floor slab', assignedTo: w2, status: 'in-progress', priority: 'high', dueDate: '2026-04-20', completedAt: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p1, title: 'Electrical conduit layout', description: 'Plan and install electrical conduit system for floors 1-5', assignedTo: w4, status: 'pending', priority: 'medium', dueDate: '2026-05-10', completedAt: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p2, title: 'Pile foundation drilling', description: 'Drill piles for bridge piers P1 through P4', assignedTo: w1, status: 'in-progress', priority: 'critical', dueDate: '2026-04-30', completedAt: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p2, title: 'Safety barrier installation', description: 'Install temporary safety barriers along construction zone', assignedTo: w3, status: 'completed', priority: 'high', dueDate: '2026-03-15', completedAt: '2026-03-14T16:00:00Z', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p3, title: 'Demolition of existing platform edge', description: 'Carefully demolish existing platform walls for expansion', assignedTo: w5, status: 'blocked', priority: 'high', dueDate: '2026-05-01', completedAt: null, createdAt: new Date().toISOString() }
  ];

  store.materials = [
    { id: uuidv4(), projectId: p1, name: 'TMT Steel Bars (12mm)', quantity: 500, unit: 'tons', unitCost: 52000, supplier: 'Tata Steel', status: 'delivered', requestedBy: 'Rajesh Kumar', requestDate: '2026-01-20', deliveryDate: '2026-02-10', notes: '', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p1, name: 'Portland Cement (OPC 53)', quantity: 2000, unit: 'bags', unitCost: 380, supplier: 'UltraTech', status: 'ordered', requestedBy: 'Rajesh Kumar', requestDate: '2026-03-01', deliveryDate: null, notes: '', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p1, name: 'River Sand', quantity: 300, unit: 'cubic meters', unitCost: 1800, supplier: 'Local Supplier', status: 'requested', requestedBy: 'Amit Sharma', requestDate: '2026-04-01', deliveryDate: null, notes: '', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p2, name: 'Concrete Mix M40', quantity: 800, unit: 'cubic meters', unitCost: 5500, supplier: 'RMC India', status: 'approved', requestedBy: 'Rajesh Kumar', requestDate: '2026-02-15', deliveryDate: null, notes: '', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p2, name: 'Structural Steel Plates', quantity: 150, unit: 'tons', unitCost: 65000, supplier: 'SAIL', status: 'requested', requestedBy: 'Priya Patel', requestDate: '2026-03-20', deliveryDate: null, notes: '', createdAt: new Date().toISOString() }
  ];

  const today = new Date().toISOString().split('T')[0];
  store.daily_logs = [
    { id: uuidv4(), projectId: p1, date: '2026-04-04', weather: 'Sunny', temperature: '34°C', workSummary: 'Completed rebar work on ground floor section B. Concrete pouring started for section A. Crane mobilized for upper floor formwork.', workforceCount: 42, hoursWorked: 8.5, equipmentUsed: 'Tower Crane, Concrete Mixer, Vibrator', safetyIncidents: 0, notes: 'Good progress. On schedule.', createdBy: 'Rajesh Kumar', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p1, date: '2026-04-05', weather: 'Partly Cloudy', temperature: '31°C', workSummary: 'Continued concrete pouring for section A. Formwork preparation for first floor. Safety audit completed.', workforceCount: 38, hoursWorked: 7, equipmentUsed: 'Tower Crane, Concrete Pump', safetyIncidents: 0, notes: 'Minor delay due to concrete pump issues.', createdBy: 'Rajesh Kumar', createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p2, date: '2026-04-05', weather: 'Clear', temperature: '29°C', workSummary: 'Pile drilling completed for P2. Started P3 pile work. Traffic management zone extended.', workforceCount: 25, hoursWorked: 9, equipmentUsed: 'Piling Rig, Excavator, Trucks', safetyIncidents: 0, notes: 'Ahead of schedule on piling work.', createdBy: 'Priya Patel', createdAt: new Date().toISOString() }
  ];

  store.attendance = [
    { id: uuidv4(), workerId: w1, projectId: p1, date: today, status: 'present', checkIn: '08:00', checkOut: '17:00', hoursWorked: 9, notes: '', createdAt: new Date().toISOString() },
    { id: uuidv4(), workerId: w2, projectId: p1, date: today, status: 'present', checkIn: '08:30', checkOut: '17:30', hoursWorked: 9, notes: '', createdAt: new Date().toISOString() },
    { id: uuidv4(), workerId: w3, projectId: p2, date: today, status: 'present', checkIn: '07:45', checkOut: '16:45', hoursWorked: 9, notes: '', createdAt: new Date().toISOString() },
    { id: uuidv4(), workerId: w4, projectId: p1, date: today, status: 'late', checkIn: '09:30', checkOut: '17:00', hoursWorked: 7.5, notes: 'Traffic delay', createdAt: new Date().toISOString() },
    { id: uuidv4(), workerId: w5, projectId: p3, date: today, status: 'absent', checkIn: null, checkOut: null, hoursWorked: 0, notes: 'Medical leave', createdAt: new Date().toISOString() },
    { id: uuidv4(), workerId: w6, projectId: p1, date: today, status: 'present', checkIn: '08:00', checkOut: '18:00', hoursWorked: 10, notes: 'Overtime for design review', createdAt: new Date().toISOString() }
  ];

  store.issues = [
    { id: uuidv4(), projectId: p1, title: 'Water seepage in basement', description: 'Water seepage detected in basement level 2 near stairwell. Needs immediate waterproofing treatment.', severity: 'high', status: 'open', reportedBy: 'Priya Patel', assignedTo: null, photoUrl: null, resolution: null, reportDate: '2026-04-03', resolvedDate: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p1, title: 'Crack in column C4', description: 'Hairline crack observed in column C4 on ground floor. Structural assessment needed.', severity: 'critical', status: 'in-progress', reportedBy: 'Rajesh Kumar', assignedTo: 'Anita Verma', photoUrl: null, resolution: null, reportDate: '2026-04-02', resolvedDate: null, createdAt: new Date().toISOString() },
    { id: uuidv4(), projectId: p2, title: 'Missing safety signage', description: 'Safety warning signs not installed at bridge approach on eastern side.', severity: 'medium', status: 'resolved', reportedBy: 'Priya Patel', assignedTo: null, photoUrl: null, resolution: 'Signs installed on 2026-04-03', reportDate: '2026-04-01', resolvedDate: '2026-04-03', createdAt: new Date().toISOString() }
  ];

  save();
  console.log('✅ Database seeded with demo data');
}

// Initialize
load();
seed();

module.exports = db;
