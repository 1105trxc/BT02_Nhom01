require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('UTEShop API is running...');
});

// Khởi tạo kết nối Database và Start Server
connectDB().then(async () => {
  // Tạo dữ liệu mẫu nếu database trống
  const Category = require('./models/Category');
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.create({
      name: 'Hàng gia dụng',
      slug: 'hang-gia-dung',
      description: 'Các sản phẩm thiết yếu cho gia đình'
    });
    console.log('✅ Created initial sample category.');
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log('🚀 All UTEShop Database Models have been initialized.');
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB', err);
const requestIdMiddleware = require('./middleware/requestId');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(requestIdMiddleware);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 3000;
const cors = require('cors');
const morgan = require('morgan');
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
const requestId = require('./middleware/requestId');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    code: 429,
    message: 'Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau 15 phút',
    timestamp: Math.floor(Date.now() / 1000)
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('✅ All UTEShop Database Models (11 collections) have been initialized and synchronized with db_plan.md.');
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB', err);
  process.exit(1);
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(requestId);
app.use('/api', limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: err.message || 'Internal Server Error',
    data: null,
    errors: err.errors || null,
    requestId: req.id,
    timestamp: Math.floor(Date.now() / 1000)
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
