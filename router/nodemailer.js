const nodemailer = require('nodemailer');


// 隨機生成驗證碼
const generateVCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let vCode = '';
    for (let i = 0; i < 6; i++) {
        vCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return vCode;
};

// 寄送驗證郵件
const sendEmail = (email, vCode) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'a0922077081@gmail.com',
                pass: 'lcdjsnyosidnolpi'
            }
        });

        const mailOptions = {
            from: 'a0922077081@gmail.com',
            to: email,
            subject: '請驗證您的帳號',
            html: ` <p>你好！</p>
                <p>你的驗證碼是：<strong style="color: #ff4e2a;">${vCode} </strong></p>
                <p>***該驗證碼5分鐘内有效***</p>`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('無法發送驗證郵件:', err);
                reject(err); // 將錯誤傳遞給 Promise 的 reject
            } else {
                console.log('驗證郵件已發送:', info.response);
                resolve(info); // 將結果傳遞給 Promise 的 resolve
            }
        });
    });
};
module.exports = { sendEmail, generateVCode };
