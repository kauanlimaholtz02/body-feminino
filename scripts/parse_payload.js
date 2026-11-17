import fs from 'fs';

const html = fs.readFileSync("/tmp/docs_full.html", "utf-8");

// Extract everything inside self.__next_f.push
const matches = [...html.matchAll(/self\.__next_f\.push\(\[1,"(.*)"\]\)/g)];
console.log("self.__next_f entries:", matches.length);

let fullPayload = "";
for (const m of matches) {
  fullPayload += m[1];
}

console.log("fullPayload length:", fullPayload.length);
fs.writeFileSync("/tmp/docs_payload.txt", fullPayload);

// Let us search for sections or text in fullPayload
const lines = fullPayload.split(/\\n|\n/);
console.log("Lines in payload:", lines.length);

for (const line of lines) {
  if (line.includes("api/v1") || line.includes("curl") || line.includes("Pix") || line.includes("endpoint") || line.includes("Header") || line.includes("Secret") || line.includes("transactions") || line.includes("cria") || line.includes("Cobrança") || line.includes("cobranca")) {
    console.log("Match:", line.slice(0, 180));
  }
}
