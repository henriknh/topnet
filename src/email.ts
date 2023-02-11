import nodemailer, { SendMailOptions } from "nodemailer";

if (!process.env.EMAIL_HOST) {
  throw "Email host missing";
}
if (!process.env.EMAIL_USER) {
  throw "Email sender missing";
}
if (!process.env.EMAIL_PASS) {
  throw "Email password missing";
}
if (!process.env.EMAIL_RECIEVERS) {
  throw "Email recievers missing";
}

const SMTP_TRANSPORT = {
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

export const sendEmail = async (mail: SendMailOptions) => {
  const transporter = await nodemailer.createTransport(SMTP_TRANSPORT);
  const info = await transporter.sendMail(mail);
};

export const buildEmail = async (result: any) => {
  let html = "";
  Object.keys(result).forEach((section) => {
    if (Object.keys(result).length >= 2) {
      html += `<strong>${section}</strong></br></br>`;
      console.log(section);
    }

    result[section].forEach((href: string) => {
      html += `${href}</br>`;
      console.log(` - ${href}`);
    });

    html += `</br></br>`;
    console.log("");
  });

  await sendEmail({
    from: `"Topnet" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_RECIEVERS?.split(";").join(","),
    subject: "Topnet",
    html,
  });
};
