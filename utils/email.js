/** this is a  simple helper for sending system emails with Nodemailer
 * right now I use it to email admins when a new member gets added
 */

const nodemailer = require('nodemailer');

// creates a reusable mail transporter
// all the SMTP info comes from .env so it’s easy to swap later
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,      
  secure: false,                           
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


const adminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim())
  : [];

exports.sendNewMemberNotification = async function (member) {
  if (adminEmails.length === 0) {
    console.warn("⚠️ No ADMIN_EMAILS set — skipping new member email.");
    return;
  }

  const mailOptions = {
    from: `"WardWorks" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: adminEmails,
    subject: `New Member Added: ${member.firstName} ${member.lastName}`,
    text: `
A new member has been added to WardWorks!

Name:  ${member.firstName} ${member.lastName}
Email: ${member.email || 'Not provided'}
Phone: ${member.phone || 'Not provided'}

Log in to WardWorks to view full member details.
`.trim()
  };

  // send the email using the transporter
  await transporter.sendMail(mailOptions);
};
