var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var TaiKhoan = require('../models/taikhoan');
const { isAdmin, isAdmin_Nhanvien, isLoggedIn } = require('../modules/auth');
const multer = require('multer');
const path = require('path');

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

// GET: Danh sách tài khoản
router.get('/', isAdmin, async (req, res) => {
	const q = req.query.q || '';
	const sort = req.query.sort || '';
	const page = parseInt(req.query.page) || 1;
	const limit = 5;
	const skip = (page - 1) * limit;

	// Tìm kiếm
	const search = q
		? {
			$or: [
				{ HoVaTen: { $regex: q, $options: 'i' } },
				{ Email: { $regex: q, $options: 'i' } },
			],
		}
		: {};

	// Sắp xếp
	let sortOption = {};
	if (sort === 'name_asc') sortOption = { HoVaTen: 1 };
	if (sort === 'name_desc') sortOption = { HoVaTen: -1 };

	const totalItems = await TaiKhoan.countDocuments(search);
	const taikhoan = await TaiKhoan.find(search)
		.sort(sortOption)
		.skip(skip)
		.limit(limit);

	const totalPages = Math.ceil(totalItems / limit);

	res.render('taikhoan', {
		title: 'Danh sách tài khoản',
		taikhoan,
		currentPage: page,
		totalPages,
		q,
		sort,
		limit,
	});
});


// GET: Thêm tài khoản
router.get('/them', isAdmin, async (req, res) => {
	res.render('taikhoan_them', {
		title: 'Thêm tài khoản'
	});
});

// POST: Thêm tài khoản
router.post('/them', isAdmin, upload.single('HinhAnh'), async (req, res) => {
	try {
		const salt = bcrypt.genSaltSync(10);
		const hinhAnhPath = req.file ? '/images/avatars/' + req.file.filename : '';

		var data = {
			HoVaTen: req.body.HoVaTen,
			Email: req.body.Email,
			HinhAnh: hinhAnhPath,
			TenDangNhap: req.body.TenDangNhap,
			MatKhau: bcrypt.hashSync(req.body.MatKhau, salt)
		};
		await TaiKhoan.create(data);
		res.redirect('/taikhoan');
	} catch (error) {
		console.error(error);
		res.send('Có lỗi xảy ra khi thêm tài khoản.');
	}
});

// GET: Sửa tài khoản
router.get('/sua/:id', isAdmin, async (req, res) => {
	var id = req.params.id;
	var tk = await TaiKhoan.findById(id);
	res.render('taikhoan_sua', {
		title: 'Sửa tài khoản',
		taikhoan: tk
	});
});

// POST: Sửa tài khoản
router.post('/sua/:id', isAdmin, upload.single('HinhAnh'), async (req, res) => {
	try {
		const salt = bcrypt.genSaltSync(10);
		const hinhAnhPath = req.file ? '/images/avatars/' + req.file.filename : '';

		var id = req.params.id;
		var data = {
			HoVaTen: req.body.HoVaTen,
			Email: req.body.Email,
			HinhAnh: hinhAnhPath,
			TenDangNhap: req.body.TenDangNhap,
			QuyenHan: req.body.QuyenHan,
			KichHoat: req.body.KichHoat
		};
		if (req.body.MatKhau)
			data['MatKhau'] = bcrypt.hashSync(req.body.MatKhau, salt);
		await TaiKhoan.findByIdAndUpdate(id, data);
		res.redirect('/taikhoan');
	} catch (error) {
		console.error(error);
		res.send('Có lỗi xảy ra khi sửa tài khoản.');
	}
});

// GET: Xóa tài khoản
router.get('/xoa/:id', isAdmin, async (req, res) => {
	var id = req.params.id;
	await TaiKhoan.findByIdAndDelete(id);
	res.redirect('/taikhoan');
});

// GET: Hồ sơ của tôi
router.get('/hosocuatoi', isLoggedIn, async (req, res) => {
	const id = req.session.MaNguoiDung;
	const tk = await TaiKhoan.findById(id);
	res.render('hoso', {
		title: 'Hồ sơ cá nhân',
		taikhoan: tk
	});
});

// POST: Cập nhật hồ sơ
router.post('/hosocuatoi', isLoggedIn, upload.single('HinhAnh'), async (req, res) => {
	try {
		const salt = bcrypt.genSaltSync(10);
		const id = req.session.MaNguoiDung;

		// Lấy tài khoản hiện tại để giữ ảnh cũ nếu không có ảnh mới
		const currentUser = await TaiKhoan.findById(id);

		// Nếu người dùng upload ảnh thì lấy ảnh mới, ngược lại giữ ảnh cũ
		const hinhAnhPath = req.file
			? '/images/avatars/' + req.file.filename
			: currentUser.HinhAnh;

		const data = {
			HoVaTen: req.body.HoVaTen,
			Email: req.body.Email,
			HinhAnh: hinhAnhPath
		};

		// Nếu người dùng nhập mật khẩu mới thì cập nhật
		if (req.body.MatKhau)
			data.MatKhau = bcrypt.hashSync(req.body.MatKhau, salt);

		await TaiKhoan.findByIdAndUpdate(id, data);

		// Cập nhật session để hiển thị avatar mới luôn (nếu có)
		req.session.HinhAnh = hinhAnhPath;
		req.session.HoVaTen = req.body.HoVaTen;

		req.session.success = 'Cập nhật hồ sơ thành công';
		res.redirect('/taikhoan/hosocuatoi');
	} catch (error) {
		console.error(error);
		res.send('Có lỗi xảy ra khi cập nhật hồ sơ.');
	}
});


module.exports = router;