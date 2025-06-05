var express = require('express');
var router = express.Router();
var ChuDe = require('../models/chude');
var BaiViet = require('../models/baiviet');
const { isAdmin, isAdmin_Nhanvien } = require('../modules/auth');

// GET: Danh sách bài viết
router.get('/', isAdmin, async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = 10;
	const skip = (page - 1) * limit;
	const q = req.query.q || '';
	const sort = req.query.sort || '';
  
	// Tìm kiếm
	const searchQuery = q
	  ? { TieuDe: { $regex: q, $options: 'i' } }
	  : {};
  
	// Sắp xếp
	let sortOption = {};
	if (sort === 'date_desc') sortOption = { NgayDang: -1 };
	else if (sort === 'date_asc') sortOption = { NgayDang: 1 };
  
	try {
	  const totalItems = await BaiViet.countDocuments(searchQuery);
	  const baiviet = await BaiViet.find(searchQuery)
		.populate('TaiKhoan')
		.populate('ChuDe')
		.sort(sortOption)
		.skip(skip)
		.limit(limit);
  
	  const totalPages = Math.ceil(totalItems / limit);
  
	  res.render('baiviet', {
		title: 'Danh sách bài viết',
		baiviet,
		currentPage: page,
		totalPages,
		q,
		sort,
	  });
	} catch (err) {
	  console.error(err);
	  res.status(500).send('Lỗi lấy danh sách bài viết');
	}
  });
  

// GET: Đăng bài viết
router.get('/them', isAdmin_Nhanvien, async (req, res) => {
	// Lấy chủ đề hiển thị vào form thêm
	var cd = await ChuDe.find();
	res.render('baiviet_them', {
		title: 'Đăng bài viết',
		chude: cd
	});
});

// POST: Đăng bài viết
router.post('/them', isAdmin_Nhanvien, async (req, res) => {
	if(req.session.MaNguoiDung) {
		var data = {
			ChuDe: req.body.MaChuDe,
			TaiKhoan: req.session.MaNguoiDung,
			TieuDe: req.body.TieuDe,
			TomTat: req.body.TomTat,
			NoiDung: req.body.NoiDung
		};
		await BaiViet.create(data);
		req.session.success = 'Đã đăng bài viết thành công và đang chờ kiểm duyệt.';
		res.redirect('/success');
	} else {
		res.redirect('/dangnhap');
	}
});

// GET: Sửa bài viết
router.get('/sua/:id', isAdmin_Nhanvien, async (req, res) => {
	var id = req.params.id;
	var cd = await ChuDe.find();
	var bv = await BaiViet.findById(id);
	res.render('baiviet_sua', {
		title: 'Sửa bài viết',
		chude: cd,
		baiviet: bv
	});
});

// POST: Sửa bài viết
router.post('/sua/:id', isAdmin_Nhanvien, async (req, res) => {
	var id = req.params.id;
	var data = {
		ChuDe: req.body.MaChuDe,
		TieuDe: req.body.TieuDe,
		TomTat: req.body.TomTat,
		NoiDung: req.body.NoiDung
	};
	await BaiViet.findByIdAndUpdate(id, data);
	req.session.success = 'Đã cập nhật bài viết thành công và đang chờ kiểm duyệt.';
	res.redirect('/success');
});

// GET: Xóa bài viết
router.get('/xoa/:id', isAdmin_Nhanvien, async (req, res) => {
	var id = req.params.id;
	await BaiViet.findByIdAndDelete(id);
	
	// Trở lại trang trước
	res.redirect(req.get('Referrer') || '/');
});

// GET: Duyệt bài viết
router.get('/duyet/:id', isAdmin, async (req, res) => {
	var id = req.params.id;
	var bv = await BaiViet.findById(id);
	await BaiViet.findByIdAndUpdate(id, { 'KiemDuyet': 1 - bv.KiemDuyet });
	
	// Trở lại trang trước
	res.redirect(req.get('Referrer') || '/');
});

// GET: Danh sách bài viết của tôi
router.get('/cuatoi', isAdmin_Nhanvien, async (req, res) => {
	if(req.session.MaNguoiDung) {
		// Mã người dùng hiện tại
		var id = req.session.MaNguoiDung;
		var bv = await BaiViet.find({ TaiKhoan: id })
			.populate('ChuDe')
			.populate('TaiKhoan').exec();
		res.render('baiviet_cuatoi', {
			title: 'Bài viết của tôi',
			baiviet: bv
		});
	} else {
		res.redirect('/dangnhap');
	}
});

module.exports = router;