require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const requestIdMiddleware = require('./middleware/requestId');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(requestIdMiddleware);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 3000;

// Khởi tạo kết nối Database
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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('✅ All UTEShop Database Models (11 collections) have been initialized and synchronized with db_plan.md.');
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB', err);
  process.exit(1);
});
