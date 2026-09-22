import fs from "node:fs";

const file = "src/lib/services/space-service.ts";

let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "verificationStatus:string;operationalStatus:string;",
  "verificationStatus:string;operationalStatus:string;verified:boolean;"
);

content = content.replace(
  "verificationStatus:String(doc.verificationStatus),operationalStatus:String(doc.operationalStatus),",
  "verificationStatus:String(doc.verificationStatus),operationalStatus:String(doc.operationalStatus),verified:doc.verificationStatus === \"APPROVED\" && doc.operationalStatus === \"ACTIVE\","
);

fs.writeFileSync(file, content, "utf8");

console.log("Added verified field to MarketplaceSpace.");
