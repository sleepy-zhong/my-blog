const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '2014918159@qq.com',
    pass: process.env.SMTP_PASS || 'your_smtp_auth_code'
  }
});

async function sendMail(to, subject, html) {
  return transporter.sendMail({
    from: process.env.SMTP_USER || '2014918159@qq.com',
    to,
    subject,
    html
  });
}

module.exports = { sendMail };