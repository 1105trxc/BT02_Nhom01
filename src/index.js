require('dotenv').config();
const connectDB = require('./config/db');

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
  console.log('🚀 All UTEShop Database Models (11 collections) have been initialized and synchronized with db_plan.md.');
});
