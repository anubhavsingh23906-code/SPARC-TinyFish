import fs from "node:fs";

const file = "src/lib/intelligence/engine.ts";

let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /capacity:s\.capacity\?₹10/g,
  "capacity:s.capacity??10"
);

fs.writeFileSync(file, content, "utf8");

console.log("Fixed corrupted capacity expression in engine.ts");
