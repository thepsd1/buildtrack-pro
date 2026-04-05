const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  try {
    const { projectId, status, severity } = req.query;
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    let issues = db.getAll('issues', filters);
    issues = issues.map(i => {
      const p = db.getById('projects', i.projectId);
      return { ...i, projectName: p?.name || null };
    });
    const order = { critical: 1, high: 2, medium: 3, low: 4 };
    issues.sort((a, b) => (order[a.severity] || 5) - (order[b.severity] || 5));
    res.json(issues);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { projectId, title, description, severity, status, reportedBy, assignedTo, photoUrl, resolution } = req.body;
    const issue = db.insert('issues', { projectId, title, description, severity: severity || 'medium', status: status || 'open', reportedBy, assignedTo, photoUrl, resolution, reportDate: new Date().toISOString().split('T')[0], resolvedDate: null });
    const p = db.getById('projects', issue.projectId);
    res.status(201).json({ ...issue, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { title, description, severity, status, assignedTo, photoUrl, resolution } = req.body;
    const updates = { title, description, severity, status, assignedTo, photoUrl, resolution };
    if (status === 'resolved' || status === 'closed') updates.resolvedDate = new Date().toISOString().split('T')[0];
    const issue = db.update('issues', req.params.id, updates);
    const p = db.getById('projects', issue.projectId);
    res.json({ ...issue, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try { db.delete('issues', req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
