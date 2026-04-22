const { sendMail } = require('../utils/mailer')
const errorCode = require('../middleware/errorCode')

exports.sendTestMail = async (req, res, next) => {
  try {
    const recipient = String(req.body?.to || req.body?.email || '').trim()
    const subject = String(req.body?.subject || '??????').trim()
    const html = req.body?.html || '<b>????????</b>'

    if (!recipient) {
      return next({
        status: 400,
        code: errorCode.INVALID_PARAMS.code,
        message: '????????',
      })
    }

    await sendMail(recipient, subject || '??????', html)
    return res.success(null, '??????')
  } catch (err) {
    return next({
      status: 500,
      code: errorCode.SYSTEM_ERROR.code,
      message: '??????',
      data: err.message,
    })
  }
}
