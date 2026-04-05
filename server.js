const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connect, seed } = require('./database/init');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Public routes (no auth needed) ───────────────────────
app.use('/api/auth', require('./routes/auth'));

// ── Protected routes (require valid JWT) ─────────────────
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));
app.use('/api/projects',  authMiddleware, require('./routes/projects'));
app.use('/api/tasks',     authMiddleware, require('./routes/tasks'));
app.use('/api/workers',   authMiddleware, require('./routes/workers'));
app.use('/api/materials', authMiddleware, require('./routes/materials'));
app.use('/api/daily-logs',authMiddleware, require('./routes/dailyLogs'));
app.use('/api/attendance',authMiddleware, require('./routes/attendance'));
app.use('/api/issues',    authMiddleware, require('./routes/issues'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB then start server
async function start() {
  try {
    await connect();
    await seed();
    app.listen(PORT, () => {
      console.log(`\n🏗️  BuildTrack Pro`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`✅ Server running at: http://localhost:${PORT}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
