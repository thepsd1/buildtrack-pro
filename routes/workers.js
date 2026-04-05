const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;
    const workers = (await db.getAll('workers', filters)).sort((a, b) => a.name.localeCompare(b.name));
    res.json(workers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const worker = await db.getById('workers', req.params.id);
    if (!worker) return res.status(404).json({ error: 'Not found' });
    const attendance = await db.getAll('attendance', { workerId: req.params.id });
    const summary = {};
    attendance.forEach(a => { summary[a.status] = (summary[a.status] || 0) + 1; });
    const attendanceSummary = Object.entries(summary).map(([status, count]) => ({ status, count }));
    const tasks = await db.getAll('tasks', { assignedTo: req.params.id });
    const assignedTasks = await Promise.all(tasks.map(async t => { const p = await db.getById('projects', t.projectId); return { ...t, projectName: p?.name || null }; }));
    res.json({ ...worker, attendanceSummary, assignedTasks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, role, phone, email, hourlyRate, status } = req.body;
    const worker = await db.insert('workers', { name, role, phone, email, hourlyRate: Number(hourlyRate) || 0, status: status || 'active' });
    res.status(201).json(worker);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, role, phone, email, hourlyRate, status } = req.body;
    const worker = await db.update('workers', req.params.id, { name, role, phone, email, hourlyRate: Number(hourlyRate), status });
    res.json(worker);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('workers', req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
