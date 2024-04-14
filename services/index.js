const crypto = require("crypto");
const nodemailer = require('nodemailer');
const md5Hash = (text) => {
  return crypto.createHash("md5").update(text).digest("hex");
};
const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const generateEmployeeID = async () => {
  const { nanoid } = await import('nanoid');
  const randomID = nanoid();
  return `DTC-${randomID}`;
}
const sendLoginDetailsEmail = async (email, password) => {

  try {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    let info = await transporter.sendMail({
      from: process.env.SMTP_USER, 
      to: email, 
      subject: 'Your Login Details', 
      text: `Your login ID is your email address (${email}) and your password is ${password}.`, 
      html: `<p>Your login ID is your email address (${email}) and your password is ${password}</p>`
    });
    return info
  } catch (error) {
    console.log(error);
  }
};
const generateRandomPassword = () => {
  const length = 8; // Length of the generated password
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Characters to include in the password
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};


module.exports = {
  md5Hash,
  generateEmployeeID,
  capitalizeFirstLetter,
  generateRandomPassword,
  sendLoginDetailsEmail,
};
