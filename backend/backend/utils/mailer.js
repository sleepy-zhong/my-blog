const nodemailer = require('nodemailer')

let transporter = null

function getMailConfig() {
  const host = String(process.env.SMTP_HOST || '').trim()
  const port = Number(process.env.SMTP_PORT || 465)
  const user = String(process.env.SMTP_USER || '').trim()
  const pass = String(process.env.SMTP_PASS || '').trim()
  const from = String(process.env.SMTP_FROM || user).trim()

  if (!host || !port || !user || !pass) {
    throw new Error('邮件服务未配置完整，请检查 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS')
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    from,
  }
}

function getTransporter() {
  if (!transporter) {
    const config = getMailConfig()
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    })
  }

  return transporter
}

async function sendMail(to, subject, html) {
  const config = getMailConfig()

  return getTransporter().sendMail({
    from: config.from,
    to,
    subject,
    html,
  })
}

module.exports = { sendMail }
