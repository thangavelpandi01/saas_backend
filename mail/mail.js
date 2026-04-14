const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true only for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email with validation and error handling
 * @param {Object} emailOptions - Email configuration
 * @param {string} emailOptions.to - Recipient email address
 * @param {string} emailOptions.subject - Email subject
 * @param {string} emailOptions.text - Plain text version
 * @param {string} emailOptions.html - HTML version
 * @returns {Promise<Object>} Email sending result
 */
const sendMail = async ({ to, subject, text, html }) => {
  try {
    // Validate required fields
    if (!to || !subject) {
      throw new Error("Email 'to' and 'subject' are required");
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials not configured in environment variables");
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent successfully");
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📮 Recipient: ${to}`);

    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter is ready to send emails");
  }
});

module.exports = sendMail;

