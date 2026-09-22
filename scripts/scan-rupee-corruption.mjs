import fs from "node:fs";
import path from "node:path";

function walk(dir) {
  const result = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...walk(full));
    } else if (
      /\.(ts|tsx)$/.test(entry.name)
    ) {
      result.push(full);
    }
  }

  return result;
}

const files = walk("src");

console.log("");
console.log("==============================================");
console.log("REMAINING ₹ OCCURRENCES");
console.log("==============================================");

let total = 0;

for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes("₹")) {
      total++;

      const col = line.indexOf("₹");

      console.log("");
      console.log(`${file}:${index + 1}`);
      console.log(`  ${line.trim()}`);

      const start = Math.max(0, col - 45);
      const end = Math.min(line.length, col + 75);

      console.log(
        `  CONTEXT: ...${line.slice(start, end)}...`,
      );
    }
  });
}

console.log("");
console.log(`TOTAL OCCURRENCES: ${total}`);
console.log("==============================================");
