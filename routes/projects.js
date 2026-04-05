const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  try {
    const projects = db.getAll('projects').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = projects.map(p => {
      const tasks = db.getAll('tasks', { projectId: p.id });
      const issues = db.getAll('issues', { projectId: p.id });
      return {
        ...p,
        taskCount: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        openIssues: issues.filter(i => i.status === 'open' || i.status === 'in-progress').length
      };
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  const project = db.getById('projects', req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

router.post('/', (req, res) => {
  try {
    const { name, location, client, description, startDate, endDate, budget, status } = req.body;
    const project = db.insert('projects', { name, location, client, description, startDate, endDate, budget: Number(budget) || 0, status: status || 'active' });
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { name, location, client, description, startDate, endDate, budget, status } = req.body;
    const project = db.update('projects', req.params.id, { name, location, client, description, startDate, endDate, budget: Number(budget), status });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db.deleteWhere('tasks', 'projectId', req.params.id);
    db.deleteWhere('materials', 'projectId', req.params.id);
    db.deleteWhere('daily_logs', 'projectId', req.params.id);
    db.deleteWhere('attendance', 'projectId', req.params.id);
    db.deleteWhere('issues', 'projectId', req.params.id);
    db.delete('projects', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
