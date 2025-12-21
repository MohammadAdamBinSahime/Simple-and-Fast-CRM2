// Google Calendar Integration - uses Replit's Google Calendar connector
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
}

export async function listCalendarEvents(timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const now = new Date();
  const defaultTimeMin = timeMin || now;
  const defaultTimeMax = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: defaultTimeMin.toISOString(),
    timeMax: defaultTimeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });

  const events = response.data.items || [];
  
  return events.map(event => ({
    id: event.id || '',
    title: event.summary || 'Untitled',
    description: event.description || undefined,
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    allDay: !event.start?.dateTime,
    location: event.location || undefined,
    htmlLink: event.htmlLink || undefined,
  }));
}

export async function createCalendarEvent(event: {
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
}): Promise<CalendarEvent> {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const eventData: any = {
    summary: event.title,
    description: event.description,
    location: event.location,
  };

  if (event.allDay) {
    eventData.start = { date: event.start.split('T')[0] };
    eventData.end = { date: event.end.split('T')[0] };
  } else {
    eventData.start = { dateTime: event.start, timeZone: 'UTC' };
    eventData.end = { dateTime: event.end, timeZone: 'UTC' };
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: eventData,
  });

  return {
    id: response.data.id || '',
    title: response.data.summary || 'Untitled',
    description: response.data.description || undefined,
    start: response.data.start?.dateTime || response.data.start?.date || '',
    end: response.data.end?.dateTime || response.data.end?.date || '',
    allDay: !response.data.start?.dateTime,
    location: response.data.location || undefined,
    htmlLink: response.data.htmlLink || undefined,
  };
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = await getUncachableGoogleCalendarClient();
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
}
