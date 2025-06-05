const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const YeuThichSchema = new Schema({
  nguoidung: { type: Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  baiviet: { type: Schema.Types.ObjectId, ref: 'BaiViet', required: true },
  ngay: { type: Date, default: Date.now }
});

YeuThichSchema.index({ nguoidung: 1, baiviet: 1 }, { unique: true });

module.exports = mongoose.model('YeuThich', YeuThichSchema);
