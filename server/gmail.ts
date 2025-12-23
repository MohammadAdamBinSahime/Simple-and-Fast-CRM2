// Gmail integration for sending emails directly from user's Gmail account
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function createEmailMessage(options: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}): string {
  const boundary = 'boundary_' + Date.now();
  
  let message = [
    `To: ${options.to}`,
    options.cc ? `Cc: ${options.cc}` : '',
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: ${options.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
    '',
    options.body
  ].filter(Boolean).join('\r\n');

  // Encode to base64url format required by Gmail API
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedMessage;
}

export async function sendEmailViaGmail(options: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}) {
  const gmail = await getUncachableGmailClient();
  
  const rawMessage = createEmailMessage({
    to: options.to,
    cc: options.cc,
    subject: options.subject,
    body: options.isHtml ? options.body : options.body.replace(/\n/g, '<br>'),
    isHtml: options.isHtml ?? true,
  });

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
    },
  });

  return result.data;
}
