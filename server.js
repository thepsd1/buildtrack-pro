const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connect, seed } = require('./database/init');

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

// API Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/workers',   require('./routes/workers'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/daily-logs',require('./routes/dailyLogs'));
app.use('/api/attendance',require('./routes/attendance'));
app.use('/api/issues',    require('./routes/issues'));

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
      console.log(`📊 API available at:  http://localhost:${PORT}/api`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
