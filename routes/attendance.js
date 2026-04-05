const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  try {
    const { projectId, date, workerId } = req.query;
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (date) filters.date = date;
    if (workerId) filters.workerId = workerId;
    let records = db.getAll('attendance', filters);
    records = records.map(a => {
      const w = db.getById('workers', a.workerId);
      const p = db.getById('projects', a.projectId);
      return { ...a, workerName: w?.name || 'Unknown', workerRole: w?.role || '', projectName: p?.name || '' };
    }).sort((a, b) => b.date.localeCompare(a.date) || a.workerName.localeCompare(b.workerName));
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', (req, res) => {
  try {
    const { records } = req.body;
    records.forEach(r => {
      db.upsertAttendance({
        workerId: r.workerId, projectId: r.projectId, date: r.date,
        status: r.status || 'present', checkIn: r.checkIn, checkOut: r.checkOut,
        hoursWorked: Number(r.hoursWorked) || 0, notes: r.notes || ''
      });
    });
    res.status(201).json({ message: `${records.length} records saved` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { workerId, projectId, date, status, checkIn, checkOut, hoursWorked, notes } = req.body;
    db.upsertAttendance({ workerId, projectId, date, status: status || 'present', checkIn, checkOut, hoursWorked: Number(hoursWorked) || 0, notes: notes || '' });
    res.status(201).json({ message: 'Recorded' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', (req, res) => {
  try {
    const { projectId, date } = req.query;
    const records = db.getAll('attendance', { projectId, date });
    const summary = {};
    records.forEach(r => { summary[r.status] = (summary[r.status] || 0) + 1; });
    res.json({ summary: Object.entries(summary).map(([status, count]) => ({ status, count })), total: records.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
