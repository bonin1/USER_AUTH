const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL, 
        pass: process.env.PASSWORD,
    }
});

const sendEmail = async (mailOptions) => {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.info(`Email sent: ${info.response}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


const sendVerificationEmail = async (toEmail, username, token) => {
    const verificationLink = `${process.env.BASE_URL}/user/verify/${token}`;

    const templatePath = path.resolve(__dirname, '../template/RegisterTemplate.html');
    
    try {
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');

        emailTemplate = emailTemplate
            .replace('{{username}}', username)
            .replace('{{verificationLink}}', verificationLink);

            const mailOptions = {
                from: '"Grupi Fuqishem"', 
                to: toEmail, 
                subject: 'Verify Your Email Address',
                html: emailTemplate 
            };

        await sendEmail(mailOptions);
    } catch (error) {
        console.error("Error reading email template:", error);
        throw error;
    }
};


const sendResetEmail = async (toEmail, token, username) => {
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;
    
    const templatePath = path.resolve(__dirname, '../template/ResetPassword.html');
    
    try {
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');

        emailTemplate = emailTemplate
            .replace('{{resetLink}}', resetLink)
            .replace('{{username}}', username);

            const mailOptions = {
                from: '"Grupi Fuqishem"', 
                to: toEmail, 
                subject: 'Reset Your Password',
                html: emailTemplate 
            };
            

        await sendEmail(mailOptions);
    } catch (error) {
        console.error("Error sending reset email:", error);
        throw error;
    }
};

const OTPemail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: '"Grupi Fuqishem" <no-reply@grupifuqishem.com>',
            to,
            subject,
            text,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error(`Failed to send email to ${to}: ${err.message}`);
        throw new Error('Email could not be sent');
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetEmail,
    OTPemail
};