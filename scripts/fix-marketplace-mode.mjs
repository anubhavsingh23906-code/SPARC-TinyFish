import fs from "node:fs";

const file = "src/lib/services/space-service.ts";

let content = fs.readFileSync(file, "utf8");

content = content.replace(
  'import { Space } from "@/lib/models";',
  'import { Space } from "@/lib/models";' + "\n" +
  'import { MobilityMode } from "@/lib/types";'
);

content = content.replace(
  "  mode: string;",
  "  mode: MobilityMode;"
);

content = content.replace(
  '    mode: String(space.mode ?? "PARKING"),',
  '    mode: (space.mode ?? "PARKING") as MobilityMode,'
);

fs.writeFileSync(file, content, "utf8");

console.log("Aligned MarketplaceSpace.mode with MobilityMode.");
