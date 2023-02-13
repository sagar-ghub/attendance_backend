var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "etest5251@gmail.com",
    pass: "httwqywowsbjrjtb",
  },
});

export default transporter;
