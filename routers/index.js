var express = require('express');
var router = express.Router();
var firstImage = require('../modules/firstimage');
var formatDate = require('../modules/formatDate');
var ChuDe = require('../models/chude');
var BaiViet = require('../models/baiviet');
const Link = require('../models/link');
const BinhLuan = require('../models/binhluan');
const YeuThich = require('../models/yeuthich');

// GET: Trang chủ
router.get('/', async (req, res) => {
	const links = await Link.findOne();
	// Lấy chuyên mục hiển thị vào menu
	var cm = await ChuDe.find();

	// Lấy 12 bài viết mới nhất
	var bv = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ NgayDang: -1 })
		.populate('ChuDe')
		.populate('TaiKhoan')
		.limit(6).exec();

	// Lấy 3 bài viết xem nhiều nhất hiển thị vào cột phải
	var xnn = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ LuotXem: -1 })
		.populate('ChuDe')
		.populate('TaiKhoan')
		.limit(3).exec();

	res.render('index', {
		title: 'Trang chủ',
		chuyenmuc: cm,
		baiviet: bv,
		xemnhieunhat: xnn,
		firstImage: firstImage,
		formatDate: formatDate,
		links
	});

});

// Route API xem thêm
router.get('/api/xemthem', async (req, res) => {
	const offset = parseInt(req.query.offset) || 0;

	const posts = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ NgayDang: -1 })
		.skip(offset)
		.limit(6)
		.populate('ChuDe')
		.populate('TaiKhoan');

	const result = posts.map(bv => ({
		_id: bv._id,
		tieude: bv.TieuDe,
		tomtat: bv.TomTat.length > 100 ? bv.TomTat.substring(0, 100) + '...' : bv.TomTat,
		anh: firstImage(bv.NoiDung),
		ngaydang: formatDate(bv.NgayDang),
		luotxem: bv.LuotXem || 0,
		chude: bv.ChuDe.TenChuDe
	}));

	res.json(result);
});

// GET: Trang xem nhiều (giống trang chủ nhưng sắp xếp theo LuotXem)
router.get('/xemnhieu', async (req, res) => {
	const links = await Link.findOne();
	const cm = await ChuDe.find();

	// Lấy 6 bài viết có lượt xem nhiều nhất
	const bv = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ LuotXem: -1 })
		.limit(6)
		.populate('ChuDe')
		.populate('TaiKhoan');

	// 3 bài viết xem nhiều nhất (dùng chung sidebar)
	const xnn = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ LuotXem: -1 })
		.limit(3)
		.populate('ChuDe')
		.populate('TaiKhoan');

	res.render('xemnhieu', {
		title: 'Xem nhiều',
		chuyenmuc: cm,
		baiviet: bv,
		xemnhieunhat: xnn,
		firstImage,
		formatDate,
		links
	});
});

// GET: API xem thêm bài viết xem nhiều
router.get('/api/xemthem-xemnhieu', async (req, res) => {
	const offset = parseInt(req.query.offset) || 0;

	const posts = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ LuotXem: -1 })
		.skip(offset)
		.limit(6)
		.populate('ChuDe')
		.populate('TaiKhoan');

	const result = posts.map(bv => ({
		_id: bv._id,
		tieude: bv.TieuDe,
		tomtat: bv.TomTat.length > 100 ? bv.TomTat.substring(0, 100) + '...' : bv.TomTat,
		anh: firstImage(bv.NoiDung),
		ngaydang: formatDate(bv.NgayDang),
		luotxem: bv.LuotXem || 0,
		chude: bv.ChuDe?.TenChuDe || ''
	}));

	res.json(result);
});



// GET: Lấy các bài viết cùng mã chủ đề
router.get('/baiviet/chude/:id', async (req, res) => {
	try {
		const links = await Link.findOne();
		const id = req.params.id;

		// Lấy chuyên mục hiển thị vào menu
		const cm = await ChuDe.find();

		// Lấy thông tin chủ đề hiện tại
		const cd = await ChuDe.findById(id);

		// Lấy 8 bài viết mới nhất cùng chuyên mục
		const bv = await BaiViet.find({ KiemDuyet: 1, ChuDe: id })
			.sort({ NgayDang: -1 })
			.populate('ChuDe')
			.populate('TaiKhoan')
			.limit(8).exec();

		// Lấy 3 bài viết xem nhiều nhất cùng chuyên mục
		const xnn = await BaiViet.find({ KiemDuyet: 1, ChuDe: id })
			.sort({ LuotXem: -1 })
			.populate('ChuDe')
			.populate('TaiKhoan')
			.limit(3).exec();

		res.render('baiviet_chude', {
			title: 'Bài viết cùng chuyên mục',
			chuyenmuc: cm,
			chude: cd,
			baiviet: bv,
			xemnhieunhat: xnn,
			firstImage: firstImage,
			formatDate: formatDate,
			links
		});

	} catch (err) {
		console.error('Lỗi khi hiển thị bài viết theo chủ đề:', err);
		res.status(500).send('Lỗi máy chủ');
	}
});

// Route API xem thêm bài viết cùng chuyên đề
router.get('/api/xemthem_chude', async (req, res) => {
	try {
		const offset = parseInt(req.query.offset) || 0;
		const chudeId = req.query.chude;

		// Kiểm tra đầu vào
		if (!chudeId) {
			return res.status(400).json({ error: 'Thiếu ID chủ đề' });
		}

		// Truy vấn các bài viết cùng chủ đề (phân trang)
		const posts = await BaiViet.find({ KiemDuyet: 1, ChuDe: chudeId })
			.sort({ NgayDang: -1 })
			.skip(offset)
			.limit(6)
			.populate('ChuDe')
			.populate('TaiKhoan');

		// Format dữ liệu trả về
		const result = posts.map(bv => ({
			_id: bv._id,
			tieude: bv.TieuDe,
			tomtat: bv.TomTat.length > 100 ? bv.TomTat.substring(0, 100) + '...' : bv.TomTat,
			anh: firstImage(bv.NoiDung),
			ngaydang: formatDate(bv.NgayDang),
			luotxem: bv.LuotXem || 0,
			chude: bv.ChuDe.TenChuDe
		}));

		res.json(result);
	} catch (error) {
		console.error('Lỗi khi xem thêm bài viết chủ đề:', error);
		res.status(500).json({ error: 'Lỗi máy chủ' });
	}
});


// GET: Xem bài viết
router.get('/baiviet/chitiet/:id', async (req, res) => {
	const links = await Link.findOne();
	var id = req.params.id;
	const page = parseInt(req.query.page) || 1;
	const limit = 2;
	const skip = (page - 1) * limit;

	// Lấy chuyên mục hiển thị vào menu
	var cm = await ChuDe.find();

	// Lấy thông tin bài viết hiện tại 
	var bv = await BaiViet.findById(id)
		.populate('ChuDe')
		.populate('TaiKhoan').exec();

	// Nếu không tìm thấy bài viết
	if (!bv) {
		return res.status(404).send('Không tìm thấy bài viết');
	}

	// Tăng lượt xem bài viết lên 1
	bv.LuotXem = (bv.LuotXem || 0) + 1;
	await bv.save();

	// Lấy 3 bài viết xem nhiều nhất hiển thị vào cột phải 
	var xnn = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ LuotXem: -1 })
		.populate('ChuDe')
		.populate('TaiKhoan')
		.limit(3).exec();

	// Bình luận
	const binhluan = await BinhLuan.find({ baiviet: bv._id })
		.sort({ ngay: -1 })
		.skip(skip)
		.limit(limit);
	const soBinhLuan = binhluan.length;
	const totalBL = await BinhLuan.countDocuments({ baiviet: id });

	// Yêu thích
	let yeuthich = false;
	if (req.session && req.session.MaNguoiDung) {
		const yt = await YeuThich.findOne({
			nguoidung: req.session.MaNguoiDung,
			baiviet: id
		});
		yeuthich = !!yt;
	}

	res.render('baiviet_chitiet', {
		chuyenmuc: cm,
		baiviet: bv,
		xemnhieunhat: xnn,
		firstImage: firstImage,
		binhluan,
		soBinhLuan,
		currentPage: page,
		totalPages: Math.ceil(totalBL / limit),
		links,
		yeuthich
	});
});

// GET: Tin mới nhất
router.get('/tinmoi', async (req, res) => {
	try {
		// Lấy chuyên mục hiển thị vào menu
		const cm = await ChuDe.find();
		const links = await Link.findOne();

		// Lấy các bài viết mới nhất đã kiểm duyệt
		const bv = await BaiViet.find({ KiemDuyet: 1 })
			.sort({ NgayDang: -1 }) // Sắp xếp mới nhất
			.populate('ChuDe')
			.populate('TaiKhoan')
			.limit(12).exec();

		// Lấy 3 bài viết xem nhiều nhất hiển thị vào cột phải
		var xnn = await BaiViet.find({ KiemDuyet: 1 })
			.sort({ LuotXem: -1 })
			.populate('ChuDe')
			.populate('TaiKhoan')
			.limit(3).exec();

		res.render('tinmoinhat', {
			title: 'Tin mới nhất',
			chuyenmuc: cm,
			baiviet: bv,
			firstImage: firstImage,
			formatDate: formatDate,
			links
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Lỗi server');
	}
});


// POST: Kết quả tìm kiếm
router.post('/timkiem', async (req, res) => {
	var tukhoa = req.body.tukhoa;
	const links = await Link.findOne();

	// Lấy chuyên mục hiển thị vào menu
	var cm = await ChuDe.find();

	// Lấy 12 bài viết mới nhất
	var bv = await BaiViet.find({
		KiemDuyet: 1,
		TieuDe: { $regex: tukhoa, $options: 'i' } // Tìm gần đúng, không phân biệt hoa thường
	})
		.sort({ NgayDang: -1 })
		.populate('ChuDe')
		.populate('TaiKhoan')
		.limit(12).exec();

	// Lấy 3 bài viết xem nhiều nhất hiển thị vào cột phải
	var xnn = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ LuotXem: -1 })
		.populate('ChuDe')
		.populate('TaiKhoan')
		.limit(3).exec();

	res.render('index', {
		title: 'Trang chủ',
		chuyenmuc: cm,
		baiviet: bv,
		xemnhieunhat: xnn,
		firstImage: firstImage,
		formatDate: formatDate,
		links
	});
});

// GET: Lỗi
router.get('/error', async (req, res) => {
	res.render('error', {
		title: 'Lỗi'
	});
});

// Xử lý yêu thích hoặc hủy yêu thích
router.post('/baiviet/yeuthich', async (req, res) => {
	if (!req.session || !req.session.MaNguoiDung) {
		return res.status(401).json({ message: 'Bạn cần đăng nhập' });
	}

	const { baivietId } = req.body;
	const nguoidungId = req.session.MaNguoiDung;

	try {
		const existing = await YeuThich.findOne({ nguoidung: nguoidungId, baiviet: baivietId });
		if (existing) {
			await YeuThich.deleteOne({ _id: existing._id });
			return res.json({ loved: false });
		} else {
			await YeuThich.create({ nguoidung: nguoidungId, baiviet: baivietId });
			return res.json({ loved: true });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Lỗi server' });
	}
});

// GET: Yêu thích
router.get('/baiviet/yeuthich/view', async (req, res) => {
	const links = await Link.findOne();
	// Lấy chuyên mục hiển thị vào menu
	var cm = await ChuDe.find();

	// Lấy 3 bài viết xem nhiều nhất hiển thị vào cột phải
	var xnn = await BaiViet.find({ KiemDuyet: 1 })
		.sort({ LuotXem: -1 })
		.populate('ChuDe')
		.populate('TaiKhoan')
		.limit(3).exec();

	// Nếu người dùng đã đăng nhập, lấy bài viết yêu thích
	let yeuThich = [];
	if (req.session && req.session.MaNguoiDung) {
		const danhSachYeuThich = await YeuThich.find({ nguoidung: req.session.MaNguoiDung })
			.populate({
				path: 'baiviet',
				match: { KiemDuyet: 1 },
				populate: ['ChuDe', 'TaiKhoan']
			})
			.limit(6); // lấy 6 bài viết đã yêu thích gần nhất

		// Lọc ra các bài viết còn tồn tại
		yeuThich = danhSachYeuThich
			.map(item => item.baiviet)
			.filter(bv => bv !== null);
	}

	res.render('yeuthich', {
		title: 'Yêu thích',
		chuyenmuc: cm,
		baiviet: yeuThich,
		xemnhieunhat: xnn,
		firstImage: firstImage,
		formatDate: formatDate,
		links
	});

});

// GET: API xem thêm bài viết yêu thích (theo offset)
router.get('/api/xemthem-yeuthich', async (req, res) => {
	const offset = parseInt(req.query.offset) || 0;

	// Kiểm tra user đã đăng nhập
	if (!req.session || !req.session.MaNguoiDung) {
		return res.status(401).json({ message: 'Bạn cần đăng nhập để xem bài viết yêu thích' });
	}

	try {
		// Lấy danh sách bài viết yêu thích user, skip offset và limit 6
		const danhSachYeuThich = await YeuThich.find({ nguoidung: req.session.MaNguoiDung })
			.sort({ createdAt: -1 }) // hoặc theo thời gian yêu thích
			.skip(offset)
			.limit(6)
			.populate({
				path: 'baiviet',
				match: { KiemDuyet: 1 },
				populate: ['ChuDe', 'TaiKhoan']
			});

		// Lọc bài viết còn tồn tại (không null)
		const yeuThich = danhSachYeuThich
			.map(item => item.baiviet)
			.filter(bv => bv !== null);

		const result = yeuThich.map(bv => ({
			_id: bv._id,
			tieude: bv.TieuDe,
			tomtat: bv.TomTat.length > 100 ? bv.TomTat.substring(0, 100) + '...' : bv.TomTat,
			anh: firstImage(bv.NoiDung),
			ngaydang: formatDate(bv.NgayDang),
			luotxem: bv.LuotXem || 0,
			chude: bv.ChuDe?.TenChuDe || ''
		}));

		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Lỗi server' });
	}
});


// GET: Thành công
router.get('/success', async (req, res) => {
	res.render('success', {
		title: 'Hoàn thành'
	});
});

module.exports = router;