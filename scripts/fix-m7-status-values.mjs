import fs from "node:fs";

const file = "src/lib/services/space-service.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /const\s+verificationStatus\s*=\s*String\(\s*space\.verificationStatus\s*\?\?\s*"PENDING"\s*,?\s*\);/s,
  'const verificationStatus = (space.verificationStatus ?? "PENDING") as VerificationStatus;'
);

content = content.replace(
  /const\s+operationalStatus\s*=\s*String\(\s*space\.operationalStatus\s*\?\?\s*"INACTIVE"\s*,?\s*\);/s,
  'const operationalStatus = (space.operationalStatus ?? "INACTIVE") as OperationalStatus;'
);

fs.writeFileSync(file, content, "utf8");

console.log("Fixed runtime status values.");
