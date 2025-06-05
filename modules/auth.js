function isAdmin(req, res, next) {
	if (req.session.QuyenHan === 'admin') {
		next(); // Cho phép tiếp tục
	} else {
		res.status(403).send('Bạn không có quyền truy cập.');
	}
}

function isAdmin_Nhanvien(req, res, next) {
	if (req.session.QuyenHan === 'admin' || req.session.QuyenHan === 'nhanvien') {
		next(); // Cho phép tiếp tục
	} else {
		res.status(403).send('Bạn không có quyền truy cập.');
	}
}

function isLoggedIn(req, res, next) {
	if (req.session.MaNguoiDung) {
		next();
	} else {
		res.redirect('/dangnhap');
	}
}

module.exports = {
	isAdmin,
	isAdmin_Nhanvien,
	isLoggedIn
};
