import fs from "node:fs";

const file = "src/lib/services/space-service.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  'import { Space } from "@/lib/models";',
  'import { Space } from "@/lib/models";' + "\n" +
  'import type { SpaceMode, VerificationStatus, OperationalStatus } from "@/lib/types";'
);

content = content.replace(
  '  mode: string;',
  '  mode: SpaceMode;'
);

content = content.replace(
  '  verificationStatus:string;',
  '  verificationStatus:VerificationStatus;'
);

content = content.replace(
  '  operationalStatus:string;',
  '  operationalStatus:OperationalStatus;'
);

content = content.replace(
  '    mode: (space.mode ?? "PARKING") as MobilityMode,',
  '    mode: (space.mode ?? "PARKING") as SpaceMode,'
);

content = content.replace(
  '  const verificationStatus=String(space.verificationStatus??"PENDING");',
  '  const verificationStatus=(space.verificationStatus??"PENDING") as VerificationStatus;'
);

content = content.replace(
  '  const operationalStatus=String(space.operationalStatus??"INACTIVE");',
  '  const operationalStatus=(space.operationalStatus??"INACTIVE") as OperationalStatus;'
);

fs.writeFileSync(file, content, "utf8");

console.log("MarketplaceSpace aligned with existing domain types.");
