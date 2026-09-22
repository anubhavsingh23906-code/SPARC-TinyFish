import fs from "node:fs";

const file = "src/lib/services/space-service.ts";

let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "  monthlyPrice:number|null;",
  "  monthlyPrice:number|undefined;"
);

content = content.replace(
  ' const monthly=typeof space.pricing?.monthly==="number"?Number(space.pricing.monthly):null;',
  ' const monthly=typeof space.pricing?.monthly==="number"?Number(space.pricing.monthly):undefined;'
);

content = content.replace(
  "  covered,monthly:monthly!==null,reliability,",
  "  covered,monthly:monthly!==undefined,reliability,"
);

fs.writeFileSync(file, content, "utf8");

console.log("Fixed MarketplaceSpace.monthlyPrice type.");
