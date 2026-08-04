/**
 * Cloudflare Worker for Tokenized US Earnings Calendar Subscriptions
 * Support clean URLs: /ics/s/:token.ics
 * API: POST /api/register
 */

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function buildEvent(entry) {
  const [y, m, d] = entry.date.split('-').map(Number);
  const timeSuffix = entry.time ? ` (${entry.time})` : '';

  const description = [
    `🏢 ${entry.companyName || entry.symbol}`,
    `📊 Symbol: ${entry.symbol}`,
    entry.industry ? `🏭 Industry: ${entry.industry}` : null,
    entry.fiscalQuarterEnding ? `📅 Fiscal quarter: ${entry.fiscalQuarterEnding}` : null,
    entry.epsForecast ? `💵 EPS forecast: ${entry.epsForecast}` : null,
    entry.marketCap && entry.marketCap !== 'N/A' ? `💰 Market cap: ${entry.marketCap}` : null,
    entry.time ? `⏰ Reporting: ${entry.time}` : null,
    '',
    `📱 Open in Stocks app: stocks://?symbol=${entry.symbol}`,
    `🌐 Yahoo Finance: https://finance.yahoo.com/quote/${entry.symbol}`,
    '',
    '— — —',
    'US Stock Earnings Calendar · https://earnings.ethanfun.xyz',
  ].filter(Boolean).join('\n');

  return {
    symbol: entry.symbol,
    title: `${entry.symbol} ${entry.companyName || entry.symbol}${timeSuffix} earnings`,
    description,
    date: [y, m, d],
  };
}

function generateICSContent(events, label = 'Custom Watchlist') {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ETHAN FUN//Custom US Stock Earnings Calendar//EN',
    `X-WR-CALNAME:${label} Earnings Calendar`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    const [y, m, d] = event.date;
    const yyyymmdd = `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`;
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `earnings-${event.symbol}-${yyyymmdd}@earnings.ethanfun.xyz`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${yyyymmdd}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Earnings reminder',
      'TRIGGER:-PT2H',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'Content-Type',
        },
      });
    }

    // API 1: Register subscriber & return clean Token URL
    if (url.pathname === '/api/register' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name = '', email = '', symbols = [] } = body;

        const token = generateToken();
        const subData = {
          token,
          name,
          email,
          symbols: Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))),
          createdAt: new Date().toISOString(),
        };

        // Save in KV if available
        if (env.SUBSCRIBERS) {
          await env.SUBSCRIBERS.put(`token_${token}`, JSON.stringify(subData));
          if (email) {
            await env.SUBSCRIBERS.put(`email_${email}_${token}`, JSON.stringify(subData));
          }
        }

        const cleanUrl = `${url.origin}/ics/s/${token}.ics`;
        return new Response(JSON.stringify({ success: true, token, url: cleanUrl }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
      }
    }

    // Endpoint 2: Clean Token ICS feed (/ics/s/:token.ics)
    const tokenMatch = url.pathname.match(/^\/ics\/s\/([a-z0-9]+)\.ics$/i);
    let symbols = [];
    let calLabel = 'Custom Watchlist';

    if (tokenMatch) {
      const token = tokenMatch[1];
      let subData = null;

      if (env.SUBSCRIBERS) {
        const raw = await env.SUBSCRIBERS.get(`token_${token}`);
        if (raw) subData = JSON.parse(raw);
      }

      if (subData && Array.isArray(subData.symbols)) {
        symbols = subData.symbols;
        if (subData.name) calLabel = `${subData.name}'s Watchlist`;
      }
    } else if (url.pathname === '/api/subscribe.ics' || url.pathname === '/api/custom.ics') {
      // Fallback: Query params ?symbols=AAPL,TSLA
      const rawSymbols = url.searchParams.get('symbols') || '';
      const name = url.searchParams.get('name') || '';
      symbols = Array.from(
        new Set(
          rawSymbols
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
        )
      );
      if (name) calLabel = `${name}'s Watchlist`;
    }

    if (symbols.length > 0) {
      try {
        const icsContent = generateICSContent(
          symbols.map((sym) =>
            buildEvent({
              symbol: sym,
              companyName: sym,
              date: new Date().toISOString().slice(0, 10),
            })
          ),
          calLabel
        );

        return new Response(icsContent, {
          status: 200,
          headers: {
            'content-type': 'text/calendar; charset=utf-8',
            'cache-control': 'public, max-age=3600',
            'access-control-allow-origin': '*',
          },
        });
      } catch (err) {
        return new Response(`Error generating ICS: ${err.message}`, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
