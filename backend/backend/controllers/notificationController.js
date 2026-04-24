const { sendMail } = require('../utils/mailer')
const errorCode = require('../middleware/errorCode')

exports.sendTestMail = async (req, res, next) => {
  try {
    const recipient = String(req.body?.to || req.body?.email || '').trim()
    const subject = String(req.body?.subject || '测试邮件').trim()
    const html = req.body?.html || '<b>这是一封测试邮件</b>'

    if (!recipient) {
      return next({
        status: 400,
        code: errorCode.INVALID_PARAMS.code,
        message: '收件人不能为空',
      })
    }

    await sendMail(recipient, subject || '测试邮件', html)
    return res.success(null, '测试邮件已发送')
  } catch (err) {
    return next({
      status: 500,
      code: errorCode.SYSTEM_ERROR.code,
      message: '测试邮件发送失败',
      data: err.message,
    })
  }
}
