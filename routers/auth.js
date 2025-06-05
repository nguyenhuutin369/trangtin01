var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var TaiKhoan = require('../models/taikhoan');
const multer = require('multer');
const path = require('path');
const { isAdmin, isAdmin_Nhanvien, isLoggedIn } = require('../modules/auth');

// Cấu hình multer lưu ảnh vào thư mục public/uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/avatars');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage: storage });

// GET: Đăng ký
router.get('/dangky', async (req, res) => {
	res.render('dangky', {
		title: 'Đăng ký tài khoản'
	});
});

// POST: Xử lý đăng ký
router.post('/dangky', upload.single('HinhAnh'), async (req, res) => {
    try {
        const salt = bcrypt.genSaltSync(10);
        const hinhAnhPath = req.file ? '/images/avatars/' + req.file.filename : '';

        const data = {
            HoVaTen: req.body.HoVaTen,
            Email: req.body.Email,
            HinhAnh: hinhAnhPath,
            TenDangNhap: req.body.TenDangNhap,
            MatKhau: bcrypt.hashSync(req.body.MatKhau, salt)
        };

        await TaiKhoan.create(data);
        req.session.success = 'Đã đăng ký tài khoản thành công.';
        res.redirect('/success');
    } catch (error) {
        console.error(error);
        res.send('Có lỗi xảy ra khi đăng ký.');
    }
});

// GET: Đăng nhập
router.get('/dangnhap', async (req, res) => {
	res.render('dangnhap', {
		title: 'Đăng nhập'
	});
});

// POST: Đăng nhập
router.post('/dangnhap', async (req, res) => {
	if(req.session.MaNguoiDung) {
		req.session.error = 'Người dùng đã đăng nhập rồi.';
		res.redirect('/error');
	} else {
		var taikhoan = await TaiKhoan.findOne({ TenDangNhap: req.body.TenDangNhap }).exec();
		if(taikhoan) {
			if(bcrypt.compareSync(req.body.MatKhau, taikhoan.MatKhau)) {
				if(taikhoan.KichHoat == 0) {
					req.session.error = 'Người dùng đã bị khóa tài khoản.';
					res.redirect('/error');
				} else {
					// Đăng ký session
					req.session.MaNguoiDung = taikhoan._id;
					req.session.HoVaTen = taikhoan.HoVaTen;
					req.session.Email = taikhoan.Email;
					req.session.HinhAnh = taikhoan.HinhAnh;
					req.session.QuyenHan = taikhoan.QuyenHan;
					
					res.redirect('/');
				}
			} else {
				req.session.error = 'Mật khẩu không đúng.';
				res.redirect('/error');
			}
		} else {
			req.session.error = 'Tên đăng nhập không tồn tại.';
			res.redirect('/error');
		}
	}
});

// GET: Đăng xuất
router.get('/dangxuat', async (req, res) => {
	if(req.session.MaNguoiDung) {
		// Xóa session
		delete req.session.MaNguoiDung;
		delete req.session.HoVaTen;
		delete req.session.QuyenHan;
		
		res.redirect('/');
	} else {
		req.session.error = 'Người dùng chưa đăng nhập.';
		res.redirect('/error');
	}
});

const BaiViet = require('../models/baiviet');
const ChuDe = require('../models/chude');

// GET: Đăng ký
router.get('/admin', isAdmin_Nhanvien, async (req, res) => {
const [soBaiViet, soChuDe, soTaiKhoan] = await Promise.all([
		BaiViet.countDocuments(),
		ChuDe.countDocuments(),
		TaiKhoan.countDocuments()
	]);

	res.render('admin', {
		title: 'Trang quản trị',
		soBaiViet,
		soChuDe,
		soTaiKhoan
	});
});

module.exports = router;