const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'buildtrack-pro-secret-2026';
const JWT_EXPIRES = '7d';

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) return res.status(400).json({ error: 'Mobile and password required' });

    const users = await db.getAll('users', { mobile: mobile.trim() });
    const user = users[0];
    if (!user) return res.status(401).json({ error: 'Invalid mobile number or password' });
    if (user.status === 'inactive') return res.status(403).json({ error: 'Account is deactivated' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid mobile number or password' });

    const token = jwt.sign(
      { id: user.id, name: user.name, mobile: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    res.json({ token, user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getById('users', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/auth/users ── (admin only) ───────────────────
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const users = await db.getAll('users');
    res.json(users.map(({ password, ...u }) => u));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/auth/users ── (admin only) ──────────────────
router.post('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, mobile, password, role } = req.body;
    if (!name || !mobile || !password) return res.status(400).json({ error: 'Name, mobile, and password required' });

    const existing = await db.getAll('users', { mobile });
    if (existing.length > 0) return res.status(409).json({ error: 'Mobile number already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.insert('users', { id: uuidv4(), name, mobile, password: hashed, role: role || 'worker', status: 'active' });
    const { password: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/auth/users/:id ── (admin only) ───────────────
router.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, mobile, role, status, password } = req.body;
    const updates = { name, mobile, role, status };
    if (password) updates.password = await bcrypt.hash(password, 10);
    const user = await db.update('users', req.params.id, updates);
    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/auth/users/:id ── (admin only) ────────────
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await db.delete('users', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
