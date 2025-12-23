import { Resend } from 'resend';

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  console.log('From Email configured:', connectionSettings?.settings?.from_email);
  return connectionSettings?.settings;
}

async function main() {
  try {
    const settings = await getCredentials();
    console.log('Resend settings:', { fromEmail: settings?.from_email });
    
    // Try sending with the configured from email
    const resend = new Resend(settings.api_key);
    const result = await resend.emails.send({
      from: settings.from_email,
      to: 'adamsahime1998@gmail.com',
      subject: 'Test Email from Simple & Fast CRM',
      html: '<h1>Hello!</h1><p>This is a test email from your <strong>Simple & Fast CRM</strong> application.</p><p>If you received this, email sending is working correctly!</p>',
    });
    console.log('Email result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
