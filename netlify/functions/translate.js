exports.handler = async function(event) {
  const { text, lang } = JSON.parse(event.body || '{}');
  
  if (!text || !lang) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing text or lang' }) };
  }

  try {
    const res = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        auth_key: '494d9efa-2291-41c3-a25c-ca0228da01ef:fx',
        text: text,
        source_lang: 'IT',
        target_lang: lang === 'EN' ? 'EN-GB' : lang,
        tag_handling: 'html'
      })
    });

    const data = await res.json();
    const translated = data.translations?.[0]?.text || text;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ translated })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
