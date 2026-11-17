import fs from 'fs';

async function main() {
  const res = await fetch("https://app.kirvuspay.com.br/docs", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  const html = await res.text();
  fs.writeFileSync("/tmp/docs_full.html", html);

  // Extract all script src
  const scripts = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]);
  console.log("Found scripts:", scripts.length);

  for (const s of scripts) {
    const sUrl = s.startsWith("http") ? s : "https://app.kirvuspay.com.br" + s;
    const sRes = await fetch(sUrl);
    const code = await sRes.text();
    // Search for API documentation text
    if (code.includes("api/v1") || code.includes("KirvusPay") || code.includes("x-api-key") || code.includes("curl ") || code.includes("/pix") || code.includes("qr_code") || code.includes("qrcode") || code.includes("emv")) {
      console.log("\n>>> MATCH IN SCRIPT:", s);
      // Let us extract endpoints
      const endpoints = [...code.matchAll(/\/api\/v1\/[a-zA-Z0-9_\-\/]+/g)].map(m => m[0]);
      if (endpoints.length > 0) {
        console.log("Found endpoints:", [...new Set(endpoints)]);
      }
      // Let us extract text snippets around api/v1
      const snips = [...code.matchAll(/.{0,80}(?:api\/v1|curl|pix|qrcode|qr_code|kirvuspay|secret_key|api_key).{0,80}/gi)].map(m => m[0]);
      console.log("Snippets:", snips.slice(0, 10));
    }
  }
}

main().catch(console.error);
