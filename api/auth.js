const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REDIRECT_URI = 'https://amira-magazine.vercel.app/api/auth';

module.exports = async (req, res) => {
  const { code, state } = req.query;

  // Step 1: redirect to GitHub
  if (!code) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'repo',
      state: state || ''
    });
    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }

  // Step 2: exchange code for token
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await tokenRes.json();

    if (data.error) {
      return res.status(400).send(`Auth error: ${data.error_description}`);
    }

    // Send token back to CMS via postMessage
    const script = `
      <script>
        (function() {
          function receiveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}',
              e.origin
            );
          }
          window.addEventListener('message', receiveMessage, false);
          window.opener.postMessage('authorizing:github', '*');
        })();
      </script>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(script);

  } catch (e) {
    res.status(500).send('Server error: ' + e.message);
  }
};
