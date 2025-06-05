const mongoose = require('mongoose');
const linkSchema = new mongoose.Schema({
    facebook: String,
    linkedin: String,
    twitter: String,
    youtube: String,
    tiktok: String,
    zalo: String
});
module.exports = mongoose.model('Link', linkSchema);
