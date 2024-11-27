"use server";

import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;


export async function sendEmail({ subject, text, html }: { subject: string, text: string, html: string }) {
  if (!MAILGUN_API_KEY) {
    throw new Error('MAILGUN_API_KEY is not set');
  }
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });
  mg.messages.create('forecastingmail.ethanswan.com', {
    from: "Forecasting <forecasting@forecastingmail.ethanswan.com>",
    to: ["ethanpswan@gmail.com"],
    subject, text, html,
  })
    .then(msg => console.log(msg)) // logs response data
    .catch(err => console.error(err)); // logs any error
}