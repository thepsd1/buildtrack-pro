const express = require('express');
const router = express.Router();
const { db } = require('../database/init');

router.get('/', async (req, res) => {
  try {
    const { projectId, status } = req.query;
    const filters = {};
    if (projectId) filters.projectId = projectId;
    if (status)    filters.status    = status;
    let materials = await db.getAll('materials', filters);
    materials = await Promise.all(materials.map(async m => { const p = await db.getById('projects', m.projectId); return { ...m, projectName: p?.name || null }; }));
    materials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(materials);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary/:projectId', async (req, res) => {
  try {
    const mats = await db.getAll('materials', { projectId: req.params.projectId });
    const breakdown = {};
    mats.forEach(m => { if (!breakdown[m.status]) breakdown[m.status] = { status: m.status, count: 0, totalCost: 0 }; breakdown[m.status].count++; breakdown[m.status].totalCost += (m.quantity || 0) * (m.unitCost || 0); });
    const grandTotal = mats.reduce((s, m) => s + (m.quantity || 0) * (m.unitCost || 0), 0);
    res.json({ breakdown: Object.values(breakdown), grandTotal });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { projectId, name, quantity, unit, unitCost, supplier, status, requestedBy, notes } = req.body;
    const mat = await db.insert('materials', { projectId, name, quantity: Number(quantity), unit, unitCost: Number(unitCost) || 0, supplier, status: status || 'requested', requestedBy, requestDate: new Date().toISOString().split('T')[0], notes });
    const p   = await db.getById('projects', mat.projectId);
    res.status(201).json({ ...mat, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, quantity, unit, unitCost, supplier, status, requestedBy, deliveryDate, notes } = req.body;
    const mat = await db.update('materials', req.params.id, { name, quantity: Number(quantity), unit, unitCost: Number(unitCost), supplier, status, requestedBy, deliveryDate, notes });
    const p   = await db.getById('projects', mat.projectId);
    res.json({ ...mat, projectName: p?.name || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('materials', req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
