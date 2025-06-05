const express = require('express');
const router = express.Router();
const BinhLuan = require('../models/binhluan');

router.post('/guibinhluan', async (req, res) => {
  try {
    const { ten, email, noidung, baivietId } = req.body;

    let hinhanh = "/images/avatars/user.png"; // ảnh mặc định

    // Nếu người dùng đã đăng nhập, dùng ảnh trong session
    if (req.session && req.session.MaNguoiDung) {
      hinhanh = req.session.HinhAnh || hinhanh;
    }

    const bl = new BinhLuan({
      ten,
      email,
      noidung,
      baiviet: baivietId,
      hinhanh
    });

    await bl.save();
    res.redirect('/baiviet/chitiet/' + baivietId);
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi lưu bình luận');
  }
});

module.exports = router;
