const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  try {
    const allProjects = db.getAll('projects');
    const allTasks = db.getAll('tasks');
    const allWorkers = db.getAll('workers');
    const allIssues = db.getAll('issues');
    const allMaterials = db.getAll('materials');
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = db.getAll('attendance', { date: today });
    const allLogs = db.getAll('daily_logs');

    const projects = {
      total: allProjects.length,
      active: allProjects.filter(p => p.status === 'active').length
    };
    const tasks = {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      blocked: allTasks.filter(t => t.status === 'blocked').length
    };
    const workers = {
      total: allWorkers.length,
      active: allWorkers.filter(w => w.status === 'active').length
    };
    const issues = {
      total: allIssues.length,
      open: allIssues.filter(i => i.status === 'open' || i.status === 'in-progress').length,
      critical: allIssues.filter(i => i.severity === 'critical' && (i.status === 'open' || i.status === 'in-progress')).length
    };
    const materialCost = allMaterials.reduce((s, m) => s + (m.quantity || 0) * (m.unitCost || 0), 0);
    const todayAttendance = {
      total: todayAtt.length,
      present: todayAtt.filter(a => a.status === 'present').length,
      absent: todayAtt.filter(a => a.status === 'absent').length,
      late: todayAtt.filter(a => a.status === 'late').length
    };
    const recentLogs = allLogs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(l => {
      const p = db.getById('projects', l.projectId);
      return { ...l, projectName: p?.name || '' };
    });
    const recentIssues = allIssues.filter(i => i.status === 'open' || i.status === 'in-progress')
      .sort((a, b) => { const o = { critical: 1, high: 2, medium: 3, low: 4 }; return (o[a.severity]||5) - (o[b.severity]||5); })
      .slice(0, 5).map(i => { const p = db.getById('projects', i.projectId); return { ...i, projectName: p?.name || '' }; });

    res.json({ projects, tasks, workers, issues, materialCost, todayAttendance, recentLogs, recentIssues });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
