const User = require('../models/User');

class UserService {
  /**
   * Cập nhật thông tin cá nhân (UC04)
   * @param {string} userId - ID của người dùng
   * @param {object} updateData - Dữ liệu cần cập nhật (full_name, phone)
   * @returns {Promise<object>} - Người dùng sau khi cập nhật
   */
  async updateProfile(userId, updateData) {
    try {
      // Chỉ cho phép cập nhật full_name và phone theo UC04
      const allowedUpdates = {};
      if (updateData.full_name) allowedUpdates.full_name = updateData.full_name;
      if (updateData.phone) allowedUpdates.phone = updateData.phone;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      ).select('-password'); // Không trả về password

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy thông tin cá nhân
   * @param {string} userId 
   */
  async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');
    return user;
  }
}

module.exports = new UserService();
