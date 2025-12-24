import { Resend } from "resend";

export async function sendEmailViaResend(options: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  from?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  const from = options.from || process.env.RESEND_FROM;
  if (!from) {
    throw new Error("RESEND_FROM not configured");
  }
  const resend = new Resend(apiKey);
  const html = options.isHtml ? options.body : options.body.replace(/\n/g, "<br>");
  const to = [options.to];
  const cc = options.cc ? [options.cc] : undefined;
  const result = await resend.emails.send({
    from,
    to,
    cc,
    subject: options.subject,
    html,
  });
  return result;
}
