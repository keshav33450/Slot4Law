import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendBookingEmail = async (data) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: data.lawyerEmail,
    subject: "New Consultation Booking",
    text: `
New booking received

Client: ${data.userFirstName} ${data.userLastName}
Email: ${data.userEmail}
Phone: ${data.userPhone}

Date: ${data.bookingDate}
Time: ${data.bookingTime}
Timezone: ${data.timezone}

Case: ${data.caseSummary}
`
  };

  return transporter.sendMail(mailOptions);
};

export const sendClientConfirmationEmail = async (data) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: data.userEmail,
    subject: "Booking Confirmed",
    text: `
Your consultation with ${data.lawyerName} is confirmed.

Date: ${data.bookingDate}
Time: ${data.bookingTime}

Thank you for using LegalMeet.
`
  };

  return transporter.sendMail(mailOptions);
};
