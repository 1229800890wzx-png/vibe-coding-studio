import sharp from "sharp";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = {
  original: "output/blue-white-site/01-home-approved.png",
  home: "output/blue-white-site/01-homepage.png",
  courses: "output/blue-white-site/02-education-courses.png",
  method: "output/blue-white-site/03-teaching-method.png",
  mentors: "output/blue-white-site/04-mentors.png",
  projects: "output/blue-white-site/05-project-gallery.png",
  "story-hd": "output/asset-sources/story-hd.png",
  "space-hd": "output/asset-sources/space-hd.png",
  "plant-hd": "output/asset-sources/plant-hd.png",
};
await mkdir(path.join(root, "public/art"), { recursive: true });
const report = [];
for (const [name, relative] of Object.entries(sources)) {
  const source = path.join(root, relative);
  const output = path.join(root, "public/art", name + ".webp");
  const metadata = await sharp(source).metadata();
  await sharp(source).webp({ lossless: true, effort: 6 }).toFile(output);
  const before = await sharp(source).ensureAlpha().raw().toBuffer();
  const after = await sharp(output).ensureAlpha().raw().toBuffer();
  if (!before.equals(after))
    throw new Error(`Pixel mismatch while encoding ${name}`);
  report.push({
    name,
    width: metadata.width,
    height: metadata.height,
    sourceBytes: (await stat(source)).size,
    outputBytes: (await stat(output)).size,
    pixelsIdentical: true,
    rgbaSha256: createHash("sha256").update(after).digest("hex"),
  });
}
await writeFile(
  path.join(root, "output/asset-sources/encoding-report.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
