import fs from 'fs';

const payload = fs.readFileSync("/tmp/docs_payload.txt", "utf-8");

// Unescape JSON string
let unescaped = payload.replace(/\\"/g, '"').replace(/\\n/g, '\n');

// Find all text blocks and components
fs.writeFileSync("/tmp/docs_clean.txt", unescaped);

// Let us extract all string literals in unescaped
const strings = [...unescaped.matchAll(/"([^"]{3,})"/g)].map(m => m[1]);
console.log("Total strings:", strings.length);

const interesting = strings.filter(s => 
  s.includes("api/v1") || 
  s.includes("http") || 
  s.includes("POST") || 
  s.includes("GET") || 
  s.includes("curl") || 
  s.includes("pix") || 
  s.includes("Pix") || 
  s.includes("token") || 
  s.includes("Secret") || 
  s.includes("Header") || 
  s.includes("Autentica") || 
  s.includes("Cobrança") || 
  s.includes("Transa") ||
  s.includes("webhook") ||
  s.includes("docs/") ||
  s.includes("sidebar")
);

console.log("Interesting strings:", interesting.length);
for (const s of interesting) {
  console.log("->", s);
}
