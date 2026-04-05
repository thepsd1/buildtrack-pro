const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

router.get('/', async (req, res) => {
  try {
    const { projectId, status, priority } = req.query;
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (status)    filters.status    = status;
    if (priority)  filters.priority  = priority;
    let tasks = await db.getAll('tasks', filters);
    tasks = await Promise.all(tasks.map(async t => {
      const worker  = t.assignedTo ? await db.getById('workers',  t.assignedTo) : null;
      const project = await db.getById('projects', t.projectId);
      return { ...t, workerName: worker?.name || null, projectName: project?.name || null };
    }));
    tasks.sort((a, b) => ({ critical:1, high:2, medium:3, low:4 }[a.priority]||5) - ({ critical:1, high:2, medium:3, low:4 }[b.priority]||5));
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { projectId, title, description, assignedTo, status, priority, dueDate } = req.body;
    const task   = await db.insert('tasks', { projectId, title, description, assignedTo: assignedTo || null, status: status || 'pending', priority: priority || 'medium', dueDate, completedAt: null });
    const worker = task.assignedTo ? await db.getById('workers', task.assignedTo) : null;
    res.status(201).json({ ...task, workerName: worker?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, dueDate } = req.body;
    const updates = { title, description, assignedTo: assignedTo || null, status, priority, dueDate };
    if (status === 'completed') updates.completedAt = new Date().toISOString();
    const task   = await db.update('tasks', req.params.id, updates);
    const worker = task.assignedTo ? await db.getById('workers', task.assignedTo) : null;
    res.json({ ...task, workerName: worker?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('tasks', req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
