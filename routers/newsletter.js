const express = require('express');
const router = express.Router();
const Newsletter = require('../models/newsletter');

router.post('/dangky', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng nhập email.' });

    const newEmail = new Newsletter({ email });
    await newEmail.save();

    res.status(200).json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email đã tồn tại.' });
    } else {
      res.status(500).json({ message: 'Lỗi server.' });
    }
  }
});

router.get('/unsubscribe', async (req, res) => {
	const email = req.query.email;
  
	if (!email) {
	  return res.status(400).send('Thiếu địa chỉ email.');
	}
  
	try {
	  const result = await Newsletter.deleteOne({ email: email });
  
	  if (result.deletedCount === 0) {
		return res.send('Email không tồn tại hoặc đã được hủy đăng ký.');
	  }
  
	  res.send(`
		<h2>🚫 Bạn đã hủy đăng ký bản tin thành công.</h2>
		<p>Nếu muốn đăng ký lại, hãy truy cập trang chủ.</p>
		<a href="https://trangtin-2jwy.onrender.com">← Quay lại trang chủ</a>
	  `);
	} catch (err) {
	  console.error('❌ Lỗi khi hủy đăng ký:', err.message);
	  res.status(500).send('Đã xảy ra lỗi khi xử lý yêu cầu.');
	}
  });
  

module.exports = router;
