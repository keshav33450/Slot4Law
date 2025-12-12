const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user:"deepikashreemohandas@gmail.com",
    pass: "ywavtmagdeoajcbw"
  }
});

const sendBookingEmail = async (bookingData) => {
  const mailOptions = {
    from:"deepikashreemohandas@gmail.com",
    to: bookingData.lawyerEmail,
    subject: `New Consultation Booking - ${bookingData.userFirstName} ${bookingData.userLastName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f2557; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #0f2557; border-bottom: 2px solid #d4a574; padding-bottom: 8px; margin-bottom: 15px; }
          .detail { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #555; display: inline-block; width: 140px; }
          .value { color: #333; }
          .footer { background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #d4a574; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚖️ New Consultation Booking</h2>
            <p>LegalMeet Platform</p>
          </div>
          
          <div class="content">
            <div class="highlight">
              <strong>Dear ${bookingData.lawyerName},</strong><br>
              You have received a new consultation booking request.
            </div>

            <div class="section">
              <h3>👤 Client Information</h3>
              <div class="detail">
                <span class="label">Name:</span>
                <span class="value">${bookingData.userFirstName} ${bookingData.userLastName}</span>
              </div>
              <div class="detail">
                <span class="label">Email:</span>
                <span class="value">${bookingData.userEmail}</span>
              </div>
              <div class="detail">
                <span class="label">Phone:</span>
                <span class="value">${bookingData.userPhone}</span>
              </div>
            </div>

            <div class="section">
              <h3>📅 Booking Details</h3>
              <div class="detail">
                <span class="label">Date:</span>
                <span class="value">${bookingData.bookingDate}</span>
              </div>
              <div class="detail">
                <span class="label">Time:</span>
                <span class="value">${bookingData.bookingTime}</span>
              </div>
              <div class="detail">
                <span class="label">Timezone:</span>
                <span class="value">${bookingData.timezone}</span>
              </div>
            </div>

            <div class="section">
              <h3>⚖️ Legal Matter Details</h3>
              <div class="detail">
                <span class="label">Legal Matter:</span>
                <span class="value">${bookingData.legalMatter}</span>
              </div>
              <div class="detail">
                <span class="label">Matter Type:</span>
                <span class="value">${bookingData.matterType}</span>
              </div>
              <div class="detail">
                <span class="label">Case Type:</span>
                <span class="value">${bookingData.caseType}</span>
              </div>
              <div class="detail">
                <span class="label">Case Summary:</span>
                <div style="margin-top: 8px; padding: 10px; background: white; border-radius: 4px;">
                  ${bookingData.caseSummary || 'Not provided'}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This booking was made through <strong>LegalMeet</strong> platform</p>
            <p>Please contact the client to confirm the consultation</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Optional: Send confirmation email to client
const sendClientConfirmationEmail = async (bookingData) => {
  const mailOptions = {
    from:"deepikashreemohandas@gmail.com",
    to: bookingData.userEmail,
    subject: `Consultation Booking Confirmed with ${bookingData.lawyerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f2557; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .detail { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
          .footer { background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .success { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; color: #155724; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Booking Confirmed</h2>
            <p>LegalMeet Platform</p>
          </div>
          
          <div class="content">
            <div class="success">
              <strong>Dear ${bookingData.userFirstName},</strong><br>
              Your consultation booking has been confirmed!
            </div>

            <h3>Lawyer Details:</h3>
            <div class="detail"><strong>${bookingData.lawyerName}</strong></div>
            
            <h3>Your Booking:</h3>
            <div class="detail"><strong>Date:</strong> ${bookingData.bookingDate}</div>
            <div class="detail"><strong>Time:</strong> ${bookingData.bookingTime}</div>
            <div class="detail"><strong>Timezone:</strong> ${bookingData.timezone}</div>

            <p style="margin-top: 20px;">The lawyer will contact you soon to confirm the consultation details.</p>
          </div>

          <div class="footer">
            <p>Thank you for using <strong>LegalMeet</strong></p>
            <p>For any queries, contact us at support@legalmeet.com</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Client email failed:', error);
    throw error;
  }
};

module.exports = { sendBookingEmail, sendClientConfirmationEmail };
