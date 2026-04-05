const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  try {
    const { projectId, date } = req.query;
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (date) filters.date = date;
    let logs = db.getAll('daily_logs', filters);
    logs = logs.map(l => {
      const p = db.getById('projects', l.projectId);
      return { ...l, projectName: p?.name || null };
    }).sort((a, b) => b.date.localeCompare(a.date));
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { projectId, date, weather, temperature, workSummary, workforceCount, hoursWorked, equipmentUsed, safetyIncidents, notes, createdBy } = req.body;
    const log = db.insert('daily_logs', { projectId, date, weather, temperature, workSummary, workforceCount: Number(workforceCount) || 0, hoursWorked: Number(hoursWorked) || 0, equipmentUsed, safetyIncidents: Number(safetyIncidents) || 0, notes, createdBy });
    const p = db.getById('projects', log.projectId);
    res.status(201).json({ ...log, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { weather, temperature, workSummary, workforceCount, hoursWorked, equipmentUsed, safetyIncidents, notes } = req.body;
    const log = db.update('daily_logs', req.params.id, { weather, temperature, workSummary, workforceCount: Number(workforceCount), hoursWorked: Number(hoursWorked), equipmentUsed, safetyIncidents: Number(safetyIncidents), notes });
    const p = db.getById('projects', log.projectId);
    res.json({ ...log, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try { db.delete('daily_logs', req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
