require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware toàn cục ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.use('/api/auth', authRoutes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ success: true, message: 'UTEShop API is running' });
});

// ── Khởi động server ──
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 UTEShop API Server running on http://localhost:${PORT}`);
  });
});
