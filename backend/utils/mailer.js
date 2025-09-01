const nodemailer = require('nodemailer');

exports.sendVerificationEmail = async (to, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  
      }
    });

    const mailOptions = {
      from: `"Law Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verification Successful',
      html: `<h3>Dear ${name},</h3>
             <p>Your account has been successfully verified by the admin.</p>
             <p>You can now login and use the platform.</p>
             <br><p>Regards,<br>Team</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Error sending verification email:', error.message);
  }
};
