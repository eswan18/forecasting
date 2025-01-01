"use server";

import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;


export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html: string }) {
  if (!MAILGUN_API_KEY) {
    throw new Error('MAILGUN_API_KEY is not set');
  }
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });
  console.log('Sending email to:', to);
  await mg.messages.create('forecastingmail.ethanswan.com', {
    from: "Forecasting <forecasting@forecastingmail.ethanswan.com>",
    to, subject, text, html,
  })
    .then(() => console.log(`Password reset email sent to ${to}`))
    .catch(err => console.error(`Error sending email to ${to}:`, err));
}