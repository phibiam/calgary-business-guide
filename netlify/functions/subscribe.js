// netlify/functions/subscribe.js
//
// SETUP INSTRUCTIONS:
// 1. Put this file at: netlify/functions/subscribe.js  in your project (create the folders if needed).
// 2. In your Netlify dashboard for THIS site: Site settings -> Environment variables -> Add a variable
//      Key:   MAILERLITE_API_KEY
//      Value: your real MailerLite API key (the one you were about to paste into the HTML)
// 3. Deploy. Netlify automatically detects anything in netlify/functions/ and makes it available at:
//      /.netlify/functions/subscribe
// 4. Your API key never appears in any file that gets sent to a visitor's browser -- it only lives
//    on Netlify's servers as an environment variable.

const MAILERLITE_GROUP_ID = '191977816645961148';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let name, email;
  try {
    const data = JSON.parse(event.body);
    name = (data.name || '').trim();
    email = (data.email || '').trim();
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!name) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name is required' }) };
  }
  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A valid email is required' }) };
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    // This means the environment variable wasn't set in Netlify -- a config problem, not a user problem.
    console.error('MAILERLITE_API_KEY environment variable is not set.');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        email: email,
        fields: { name: name },
        groups: [MAILERLITE_GROUP_ID]
      })
    });

    if (response.ok) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      const errText = await response.text();
      console.error('MailerLite API error:', response.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'MailerLite rejected the request' }) };
    }
  } catch (err) {
    console.error('MailerLite request failed:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not reach MailerLite' }) };
  }
};
