import fs from "node:fs";

const file = "src/lib/intelligence/engine.ts";

let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /\(s\.available-s\.forecast\)\/\(s\.capacity\?[^)]*\)/g,
  "(s.available-s.forecast)/Math.max(1,s.capacity??10)"
);

fs.writeFileSync(file, content, "utf8");

console.log("Fixed remaining corrupted recentTrend expression.");
