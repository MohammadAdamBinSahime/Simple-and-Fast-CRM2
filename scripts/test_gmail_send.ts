import { sendEmailViaGmail } from '../server/gmail';

async function main() {
  try {
    const result = await sendEmailViaGmail({
      to: 'adamsahime1998@gmail.com',
      subject: 'Test Email from Your CRM (via Gmail)',
      body: 'Hello!\n\nThis is a test email sent directly from your Gmail account through the Simple & Fast CRM application.\n\nIf you received this, Gmail email sending is working perfectly!\n\nBest regards,\nYour CRM App',
      isHtml: false,
    });
    console.log('Email sent successfully via Gmail!', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

main();
