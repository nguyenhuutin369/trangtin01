var express = require('express');
var router = express.Router();
var Link = require('../models/link');
const { isAdmin } = require('../modules/auth');

// GET: Hiển thị link
router.get('/', isAdmin, async (req, res) => {
	const link = await Link.findOne();
	res.render('link', {
		title: 'Quản lý liên kết',
		link
	});
});

// GET: Sửa
router.get('/sua/:id', isAdmin, async (req, res) => {
	const link = await Link.findById(req.params.id);
	res.render('link_sua', {
		title: 'Sửa liên kết',
		link
	});
});

// POST: Sửa
router.post('/sua/:id', isAdmin, async (req, res) => {
	const data = {
		facebook: req.body.facebook,
		twitter: req.body.twitter,
		youtube: req.body.youtube,
		linkedin: req.body.linkedin,
		tiktok: req.body.tiktok,
		zalo: req.body.zalo
	};
	await Link.findByIdAndUpdate(req.params.id, data);
	res.redirect('/link');
});

// GET: Xóa
router.get('/xoa/:id', isAdmin, async (req, res) => {
	await Link.findByIdAndDelete(req.params.id);
	res.redirect('/link');
});

module.exports = router;
