import type { Config } from "tailwindcss";
export default { content:["./src/**/*.{ts,tsx}"], theme:{extend:{colors:{ink:"#102A2D",mint:"#B6F2D2",signal:"#27C48A",cloud:"#F5F7F4",coral:"#FF7659"},boxShadow:{panel:"0 12px 32px rgba(16,42,45,.08)"}}}, plugins:[] } satisfies Config;
