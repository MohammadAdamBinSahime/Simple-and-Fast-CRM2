// Outlook integration for sending emails directly from user's Outlook account
import { Client } from '@microsoft/microsoft-graph-client';

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function sendEmailViaOutlook(options: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}) {
  const client = await getUncachableOutlookClient();
  
  const toRecipients = options.to.split(',').map(email => ({
    emailAddress: { address: email.trim() }
  }));

  const ccRecipients = options.cc 
    ? options.cc.split(',').map(email => ({
        emailAddress: { address: email.trim() }
      }))
    : [];

  const message = {
    subject: options.subject,
    body: {
      contentType: options.isHtml ? 'HTML' : 'Text',
      content: options.isHtml ? options.body : options.body.replace(/\n/g, '<br>')
    },
    toRecipients,
    ccRecipients: ccRecipients.length > 0 ? ccRecipients : undefined
  };

  const result = await client.api('/me/sendMail').post({
    message,
    saveToSentItems: true
  });

  return result;
}
