import https from 'https';

async function main() {
  const res = await fetch("https://app.kirvuspay.com.br/docs");
  const html = await res.text();
  console.log("HTML length:", html.length);
  
  // Look for text or next data
  const regex = /(api\/v1\/[a-zA-Z0-9_\-\/]+)/g;
  const set = new Set();
  let m;
  while ((m = regex.exec(html)) !== null) {
    set.add(m[1]);
  }
  console.log("Endpoints found in HTML:", Array.from(set));

  // Find chunks specifically imported in /docs
  const scriptRegex = /src="([^"]+\.js)"/g;
  const scripts = [];
  while ((m = scriptRegex.exec(html)) !== null) {
    scripts.push(m[1]);
  }
  console.log("Scripts found:", scripts);

  // Next.js RSC payload in self.__next_f.push
  const rscRegex = /self\.__next_f\.push\(\[1,"([^"]+)"\]\)/g;
  let rscText = "";
  while ((m = rscRegex.exec(html)) !== null) {
    rscText += m[1];
  }
  console.log("RSC text length:", rscText.length);
  
  // Search for keywords in rscText
  const terms = ["transaction", "pix", "secret", "api_key", "headers", "curl", "webhook", "customer", "amount"];
  for (const term of terms) {
    let count = 0;
    let pos = 0;
    while ((pos = rscText.toLowerCase().indexOf(term, pos)) !== -1) {
      if (count < 3) {
        console.log(`[${term}] snippet:`, rscText.substring(Math.max(0, pos - 40), pos + 100).replace(/\\n/g, "\n"));
      }
      count++;
      pos += term.length;
    }
    console.log(`Term "${term}" occurrences:`, count);
  }
}

main().catch(console.error);
