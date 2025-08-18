const { sendMail } = require('../utils/mailer');

exports.sendTestMail = async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    await sendMail(to, subject, html || '<b>这是一封测试邮件</b>');
    res.json({ code: 0, message: '邮件发送成功' });
  } catch (err) {
    res.status(500).json({ code: 1, message: '邮件发送失败', error: err.message });
  }
}; 

