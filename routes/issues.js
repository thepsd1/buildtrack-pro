const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

router.get('/', async (req, res) => {
  try {
    const { projectId, status, severity } = req.query;
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (status)    filters.status    = status;
    if (severity)  filters.severity  = severity;
    let issues = await db.getAll('issues', filters);
    issues = await Promise.all(issues.map(async i => { const p = await db.getById('projects', i.projectId); return { ...i, projectName: p?.name || null }; }));
    issues.sort((a, b) => ({ critical:1, high:2, medium:3, low:4 }[a.severity]||5) - ({ critical:1, high:2, medium:3, low:4 }[b.severity]||5));
    res.json(issues);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { projectId, title, description, severity, status, reportedBy, assignedTo, photoUrl, resolution } = req.body;
    const issue = await db.insert('issues', { projectId, title, description, severity: severity || 'medium', status: status || 'open', reportedBy, assignedTo, photoUrl, resolution, reportDate: new Date().toISOString().split('T')[0] });
    const p     = await db.getById('projects', issue.projectId);
    res.status(201).json({ ...issue, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, severity, status, assignedTo, photoUrl, resolution } = req.body;
    const updates = { title, description, severity, status, assignedTo, photoUrl, resolution };
    if (['resolved','closed'].includes(status)) updates.resolvedDate = new Date().toISOString().split('T')[0];
    const issue = await db.update('issues', req.params.id, updates);
    const p     = await db.getById('projects', issue.projectId);
    res.json({ ...issue, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('issues', req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
