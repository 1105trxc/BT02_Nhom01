const userService = require('../services/userService');

class UserController {
  /**
   * Cập nhật thông tin cá nhân (UC04)
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id; // Lấy từ auth middleware
      const { full_name, phone } = req.body;

      // Validation cơ bản theo UC04
      if (!full_name) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: 'Validation failed',
          data: null,
          errors: {
            full_name: 'Họ tên không được để trống'
          },
          timestamp: Date.now()
        });
      }

      const updatedUser = await userService.updateProfile(userId, { full_name, phone });

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Cập nhật thông tin thành công',
        data: updatedUser,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Update Profile Error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          code: 404,
          message: 'Người dùng không tồn tại',
          data: null,
          timestamp: Date.now()
        });
      }

      return res.status(500).json({
        success: false,
        code: 500,
        message: 'Lỗi hệ thống khi cập nhật hồ sơ',
        data: null,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Lấy thông tin cá nhân hiện tại
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await userService.getProfile(userId);

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Lấy thông tin hồ sơ thành công',
        data: user,
        timestamp: Date.now()
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: error.message,
        data: null,
        timestamp: Date.now()
      });
    }
  }
}

module.exports = new UserController();
