import fs from 'fs';

async function main() {
  const html = fs.readFileSync("/tmp/docs_full.html", "utf-8");
  const allChunks = [...new Set([...html.matchAll(/\/static\/chunks\/[^"'\\]+\.js/g)].map(m => m[0]))];
  console.log("Total unique chunks in HTML:", allChunks.length);
  
  for (const c of allChunks) {
    try {
      const res = await fetch("https://app.kirvuspay.com.br/_next" + c);
      const text = await res.text();
      const hasApi = text.includes("api/v1");
      const hasPix = text.toLowerCase().includes("pix");
      const hasTrans = text.toLowerCase().includes("transaction") || text.toLowerCase().includes("transacao");
      
      if (hasApi || (hasPix && hasTrans)) {
        console.log(">>> MATCH IN:", c);
        // Look for URLs or routes
        const routes = text.match(/\/api\/v1\/[a-zA-Z0-9_\-\/]+/g) || [];
        if (routes.length > 0) {
          console.log("  Routes:", [...new Set(routes)]);
        }
        const snips = text.match(/.{0,80}(?:api\/v1|secret|token|webhook|qrcode|pix).{0,80}/gi) || [];
        console.log("  Snippets:", snips.slice(0, 5));
      }
    } catch(e) {
      console.log("Error in", c, e.message);
    }
  }
}

main().catch(console.error);
