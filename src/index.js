require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const requestId = require('./middleware/requestId');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware toàn cục ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(requestId);

// Rate Limiting cho toàn bộ API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs
  message: {
    success: false,
    code: 429,
    message: 'Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau 15 phút',
    timestamp: Math.floor(Date.now() / 1000)
  }
});
app.use('/api', limiter);

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ success: true, message: 'UTEShop API is running' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: err.message || 'Internal Server Error',
    data: null,
    errors: err.errors || null,
    requestId: req.id || res.locals.requestId,
    timestamp: Math.floor(Date.now() / 1000)
  });
});

// ── Khởi động server ──
connectDB().then(async () => {
  // Tạo dữ liệu mẫu nếu database trống
  try {
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
  } catch (seedErr) {
    console.error('⚠️ Seeding error:', seedErr.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 UTEShop API Server running on http://localhost:${PORT}`);
    console.log('✅ All UTEShop Database Models have been initialized.');
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB', err);
  process.exit(1);
});
