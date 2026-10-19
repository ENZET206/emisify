const nodemailer = require('nodemailer');
const env = require('../config/env');

const configured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

let transporter;
function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure, auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

// Sends via SMTP when configured; otherwise logs the message (development fallback, never returned to the client).
async function sendMail({ to, subject, text, html }) {
  if (!configured()) {
    console.log(`[mail:dev] SMTP belum dikonfigurasi. Email untuk ${to}\nSubjek: ${subject}\n${text}`);
    return { delivered: false };
  }
  await getTransport().sendMail({ from: `Emisify <${env.smtp.from}>`, to, subject, text, html });
  return { delivered: true };
}

function resetEmail({ name, link, minutes, lang }) {
  const en = lang === 'en';
  const subject = en ? 'Reset your Emisify password' : 'Atur ulang password Emisify kamu';
  const text = en
    ? `Hi ${name},\n\nWe received a request to reset your Emisify password. Open this link within ${minutes} minutes:\n${link}\n\nIf you did not request this, ignore this email.`
    : `Halo ${name},\n\nKami menerima permintaan untuk mengatur ulang password Emisify kamu. Buka tautan ini dalam ${minutes} menit:\n${link}\n\nJika kamu tidak meminta ini, abaikan email ini.`;
  const html = `<div style="font-family:Arial,sans-serif;background:#FAF1E8;padding:32px"><div style="max-width:480px;margin:auto;background:#fff;border-radius:24px;padding:32px;color:#2E211B">
<h2 style="margin:0 0 12px;color:#C94A2F">Emisify</h2><p>${en ? 'Hi' : 'Halo'} ${name},</p>
<p>${en ? 'We received a request to reset your password. This link is valid for' : 'Kami menerima permintaan untuk mengatur ulang password kamu. Tautan berlaku selama'} ${minutes} ${en ? 'minutes' : 'menit'}.</p>
<p style="text-align:center;margin:28px 0"><a href="${link}" style="background:#C94A2F;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:bold">${en ? 'Reset password' : 'Atur ulang password'}</a></p>
<p style="font-size:12px;color:#7A675C">${en ? 'If you did not request this, you can ignore this email.' : 'Jika kamu tidak meminta ini, abaikan email ini.'}</p></div></div>`;
  return { subject, text, html };
}

module.exports = { sendMail, resetEmail, mailConfigured: configured };
