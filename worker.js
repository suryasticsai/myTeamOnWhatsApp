export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const CLIENT_ID = env.GITHUB_CLIENT_ID;
    const CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;
    const OAUTH_CALLBACK = 'https://personasoi.varakala-saisurya.workers.dev/callback';
    const FINAL_REDIRECT = 'https://suryasticsai.github.io/myTeamOnWhatsApp/personaManager.html';

    if (path === '/login') {
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', OAUTH_CALLBACK);
      authUrl.searchParams.set('scope', 'repo');
      return Response.redirect(authUrl.toString(), 302);
    }

    if (path === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code', { status: 400 });
      }

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          redirect_uri: OAUTH_CALLBACK, // Must match the one in /login
        }),
      });

      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        return new Response(`Auth error: ${tokenData.error_description}`, { status: 400 });
      }

      // ✅ Redirect with token in hash
      return Response.redirect(`${FINAL_REDIRECT}#access_token=${tokenData.access_token}`, 302);
    }

    return new Response('Not found', { status: 404 });
  }
};