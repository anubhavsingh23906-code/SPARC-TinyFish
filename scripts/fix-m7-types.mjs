import fs from "node:fs";

const file = "src/lib/services/space-service.ts";
let content = fs.readFileSync(file, "utf8");

// Make sure the domain types are imported.
if (!content.includes('from "@/lib/types"')) {
  content = content.replace(
    'import { Space } from "@/lib/models";',
    'import { Space } from "@/lib/models";' + "\n" +
    'import type { SpaceMode, VerificationStatus, OperationalStatus } from "@/lib/types";'
  );
}

// Fix MarketplaceSpace property types regardless of spacing/newlines.
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

// Fix the values returned by mapSpace.
content = content.replace(
  /const verificationStatus\s*=\s*String\(space\.verificationStatus\s*\?\?\s*"PENDING"\)\s*;/,
  'const verificationStatus = (space.verificationStatus ?? "PENDING") as VerificationStatus;'
);

content = content.replace(
  /const operationalStatus\s*=\s*String\(space\.operationalStatus\s*\?\?\s*"INACTIVE"\)\s*;/,
  'const operationalStatus = (space.operationalStatus ?? "INACTIVE") as OperationalStatus;'
);

content = content.replace(
  /mode\s*:\s*\(space\.mode\s*\?\?\s*"PARKING"\)\s*as\s*\w+/,
  'mode: (space.mode ?? "PARKING") as SpaceMode'
);

fs.writeFileSync(file, content, "utf8");

console.log("Domain type alignment applied.");
