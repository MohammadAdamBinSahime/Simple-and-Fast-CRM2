import { sendEmail } from '../server/resend';

async function main() {
  try {
    const result = await sendEmail({
      to: 'adamsahime1998@gmail.com',
      subject: 'Test Email from Simple & Fast CRM',
      html: '<h1>Hello!</h1><p>This is a test email from your <strong>Simple & Fast CRM</strong> application.</p><p>If you received this, email sending is working correctly!</p>',
      text: 'Hello! This is a test email from your Simple & Fast CRM application. If you received this, email sending is working correctly!'
    });
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

main();
