import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function sendEmail(options: {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  // Use Resend's test domain for sending (works without domain verification)
  // The actual user's email is set as reply-to so responses go to them
  const emailOptions: any = {
    from: 'Simple CRM <onboarding@resend.dev>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo || fromEmail,
  };
  
  if (options.cc) {
    emailOptions.cc = options.cc;
  }
  
  if (options.text) {
    emailOptions.text = options.text;
  }
  
  const result = await client.emails.send(emailOptions);
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  return result;
}
