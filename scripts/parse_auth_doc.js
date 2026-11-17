import fs from 'fs';

const html = fs.readFileSync("/tmp/auth_doc.html", "utf-8");

// Extract all /docs/... links
const docLinks = [...new Set([...html.matchAll(/\/docs\/[a-zA-Z0-9_\-\/]+/g)].map(m => m[0]))];
console.log("All Doc Links:", docLinks);

// Extract text from payload
const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"(.*)"\]\)/g)];
let payload = "";
for (const m of matches) payload += m[1];
const unescaped = payload.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\u0026/g, '&');

fs.writeFileSync("/tmp/auth_doc_clean.txt", unescaped);

// Let us find code snippets, headers, endpoints, explanations in auth doc
const lines = unescaped.split('\n');
console.log("Total lines:", lines.length);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("token") || line.includes("Bearer") || line.includes("Header") || line.includes("Authorization") || line.includes("crypto") || line.includes("chave") || line.includes("key") || line.includes("curl") || line.includes("POST")) {
    console.log(`[Line ${i}]:`, line.slice(0, 160));
  }
}
