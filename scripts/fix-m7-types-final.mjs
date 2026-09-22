import fs from "node:fs";

const file = "src/lib/services/space-service.ts";
let content = fs.readFileSync(file, "utf8");

// Remove the stale, invalid MobilityMode import.
content = content.replace(
  'import { MobilityMode } from "@/lib/types";' + "\n",
  ""
);

// Ensure MarketplaceSpace uses the actual domain types.
content = content.replace(
  /mode\s*:\s*string\s*;/,
  "mode: SpaceMode;"
);

content = content.replace(
  /verificationStatus\s*:\s*string\s*;/,
  "verificationStatus: VerificationStatus;"
);

content = content.replace(
  /operationalStatus\s*:\s*string\s*;/,
  "operationalStatus: OperationalStatus;"
);

content = content.replace(
  /mode\s*:\s*\(space\.mode\s*\?\?\s*"PARKING"\)\s*as\s*MobilityMode/,
  'mode: (space.mode ?? "PARKING") as SpaceMode'
);

content = content.replace(
  /mode\s*:\s*\(space\.mode\s*\?\?\s*"PARKING"\)\s*as\s*string/,
  'mode: (space.mode ?? "PARKING") as SpaceMode'
);

content = content.replace(
  /const verificationStatus\s*=\s*String\(space\.verificationStatus\s*\?\?\s*"PENDING"\)/,
  'const verificationStatus = (space.verificationStatus ?? "PENDING") as VerificationStatus'
);

content = content.replace(
  /const operationalStatus\s*=\s*String\(space\.operationalStatus\s*\?\?\s*"INACTIVE"\)/,
  'const operationalStatus = (space.operationalStatus ?? "INACTIVE") as OperationalStatus'
);

fs.writeFileSync(file, content, "utf8");
console.log("Removed stale MobilityMode and aligned M7 types.");
