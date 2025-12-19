import path from "path";
import fs from "fs";

// Get logo as base64 data URL for @react-pdf/renderer
export function getLogoBase64(): string {
  const logoPath = path.join(process.cwd(), "public", "LOGO TRT.png");
  const logoBuffer = fs.readFileSync(logoPath);
  const base64 = logoBuffer.toString("base64");
  return `data:image/png;base64,${base64}`;
}

// Company info constants
export const COMPANY_NAME = "PT. TARO RAKAYA TASYRA";
export const COMPANY_SUBTITLE = "Palm Oil Mill - Pabrik Kelapa Sawit";
