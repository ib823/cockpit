import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const SOURCE_LOGO = "/workspaces/cockpit/public/logo-keystone.svg";
const PUBLIC_DIR = "/workspaces/cockpit/public";

interface LogoSize {
  name: string;
  size: number;
  format?: "png" | "ico";
}

const LOGO_SIZES: LogoSize[] = [
  // Favicons
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-48.png", size: 48 },

  // PWA Icons
  { name: "icon-192.png", size: 192 },
  { name: "icon-256.png", size: 256 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },

  // Maskable icon (with padding for safe area)
  { name: "maskable-icon-512.png", size: 512 },

  // Apple touch icon
  { name: "apple-touch-icon-180.png", size: 180 },

  // Icon for general use
  { name: "keystone-icon.png", size: 256 },

  // Main logo (optimized but larger)
  { name: "logo-keystone.png", size: 1024 },
];

async function generateLogos() {
  console.log("Starting logo generation...\n");
  console.log(`Source: ${SOURCE_LOGO}`);
  console.log(`Output: ${PUBLIC_DIR}\n`);

  for (const logoConfig of LOGO_SIZES) {
    const outputPath = join(PUBLIC_DIR, logoConfig.name);

    try {
      // For maskable icon, add padding (safe area is 80% of total size)
      if (logoConfig.name.includes("maskable")) {
        const paddedSize = Math.floor(logoConfig.size * 0.8);
        const padding = Math.floor((logoConfig.size - paddedSize) / 2);

        await sharp(SOURCE_LOGO)
          .resize(paddedSize, paddedSize, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .png({ quality: 100 })
          .toFile(outputPath);
      } else {
        // Regular resize with high quality
        await sharp(SOURCE_LOGO)
          .resize(logoConfig.size, logoConfig.size, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .png({ quality: 100, compressionLevel: 9 })
          .toFile(outputPath);
      }

      console.log(`✓ Generated: ${logoConfig.name} (${logoConfig.size}x${logoConfig.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${logoConfig.name}:`, error);
    }
  }

  // Generate favicon.ico (multi-size ICO file)
  console.log("\nGenerating favicon.ico...");
  try {
    // Generate 32x32 for favicon.ico (most compatible)
    await sharp(SOURCE_LOGO)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(join(PUBLIC_DIR, "favicon.ico"));

    console.log("✓ Generated: favicon.ico");
  } catch (error) {
    console.error("✗ Failed to generate favicon.ico:", error);
  }

  console.log("\n✅ Logo generation complete!");
}

generateLogos().catch(console.error);
