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
});
