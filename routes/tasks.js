const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  try {
    const { projectId, status, priority } = req.query;
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    let tasks = db.getAll('tasks', filters);
    tasks = tasks.map(t => {
      const worker = t.assignedTo ? db.getById('workers', t.assignedTo) : null;
      const project = db.getById('projects', t.projectId);
      return { ...t, workerName: worker?.name || null, projectName: project?.name || null };
    });
    const order = { critical: 1, high: 2, medium: 3, low: 4 };
    tasks.sort((a, b) => (order[a.priority] || 5) - (order[b.priority] || 5));
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { projectId, title, description, assignedTo, status, priority, dueDate } = req.body;
    const task = db.insert('tasks', { projectId, title, description, assignedTo: assignedTo || null, status: status || 'pending', priority: priority || 'medium', dueDate, completedAt: null });
    const worker = task.assignedTo ? db.getById('workers', task.assignedTo) : null;
    res.status(201).json({ ...task, workerName: worker?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, dueDate } = req.body;
    const updates = { title, description, assignedTo: assignedTo || null, status, priority, dueDate };
    if (status === 'completed') updates.completedAt = new Date().toISOString();
    const task = db.update('tasks', req.params.id, updates);
    const worker = task.assignedTo ? db.getById('workers', task.assignedTo) : null;
    res.json({ ...task, workerName: worker?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try { db.delete('tasks', req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
