const cron = require('node-cron');
const nodemailer = require('nodemailer');
const BaiViet = require('../models/baiviet');
const Newsletter = require('../models/newsletter');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'seudodimuu@gmail.com',
        pass: 'vrjadanymbivjctl' // App password từ Gmail
    }
});

// 0 20 * * * Chạy lúc 20h mỗi ngày — đổi sang */1 * * * * để test mỗi phút
cron.schedule('0 20 * * *', async () => {
    console.log('🔔 Đang kiểm tra để gửi bản tin...');

    try {
        // const now = new Date();
        const now = new Date('2025-05-31T00:00:00Z'); // Giờ UTC
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

        const baiviets = await BaiViet.find({
            NgayDang: {
                $gte: todayUTC,
                $lt: tomorrowUTC
            }
        }).limit(10).lean();

        if (!baiviets.length) {
            console.log('⚠️ Không có bài viết nào hôm nay. ' + now.toLocaleDateString());
            return;
        }

        // Lấy tất cả email người đăng ký
        const subscribers = await Newsletter.find();

        for (const sub of subscribers) {
            // Tạo nội dung HTML
            let htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #2b6cb0; text-align: center;">📰 Bản tin công nghệ hôm nay</h2>
          <p>Chào bạn, dưới đây là những tin tức mới nhất được cập nhật trong ngày:</p>
          <ul style="padding-left: 20px; font-size: 14px;">`;

            baiviets.forEach(bv => {
                if (bv.TieuDe && bv.TomTat) {
                    htmlContent += `
            <li style="margin-bottom: 15px;">
              <a href="https://trangtin-2jwy.onrender.com/baiviet/chitiet/${bv._id}" style="color:#1a73e8; text-decoration: none;">
                <strong>${bv.TieuDe}</strong>
              </a><br>
              <span style="color:#555;">${bv.TomTat}</span>
            </li>`;
                }
            });

            htmlContent += `
          </ul>
          <p style="font-size: 12px; color: gray; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
            Bạn nhận được email này vì đã đăng ký nhận bản tin tại <a href="https://trangtin-2jwy.onrender.com" style="color: #1a73e8;">Trang tin công nghệ</a>.
          </p>
          <p style="font-size: 12px; color: gray;">
            Nếu bạn không muốn nhận bản tin nữa, hãy <a href="https://trangtin-2jwy.onrender.com/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}" style="color: #e53e3e;">nhấn vào đây để hủy đăng ký</a>.
          </p>
        </div>`;


            await transporter.sendMail({
                from: '"Trang tin công nghệ" <seudodimuu@gmail.com>',
                to: sub.email,
                subject: '📰 Bản tin công nghệ hôm nay',
                html: htmlContent
            });
            console.log(`✅ Đã gửi đến ${sub.email}`);
        }

        console.log(`📨 Đã gửi bản tin cho ${subscribers.length} người đăng ký.`);
    } catch (err) {
        console.error('❌ Lỗi khi gửi bản tin:', err.message);
    }
});
