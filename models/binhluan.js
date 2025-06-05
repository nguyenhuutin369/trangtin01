const mongoose = require('mongoose');

const BinhLuanSchema = new mongoose.Schema({
  ten: { type: String, required: true },
  email: { type: String },
  noidung: { type: String, required: true },
  ngay: { type: Date, default: Date.now },
  baiviet: { type: mongoose.Schema.Types.ObjectId, ref: 'BaiViet', required: true },
  hinhanh: { type: String }
});

module.exports = mongoose.model('BinhLuan', BinhLuanSchema);
