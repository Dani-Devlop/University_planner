// Generates terminal-style PWA icons (pure Node — zlib + hand-rolled PNG chunks)
// Usage: bun scripts/gen-icons.mjs
import zlib from "zlib";
import fs from "fs";
import path from "path";

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
function segDist(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)));
  return dist(px, py, ax + t * abx, ay + t * aby);
}

function drawIcon(S) {
  const rgba = Buffer.alloc(S * S * 4);
  const GREEN = [0, 255, 65];
  const BG = [10, 10, 10];
  const u = S / 512; // scale unit
  const border = 10 * u;
  const thick = 26 * u;

  // chevron '>' apex + arms
  const ax1 = 120 * u, ay1 = 150 * u;
  const apexX = 235 * u, apexY = 268 * u;
  const ax2 = 120 * u, ay2 = 386 * u;
  // underscore bar
  const barX1 = 268 * u, barX2 = 400 * u, barY = 386 * u;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const inBorder =
        x >= border && x < S - border && y >= border && y < S - border &&
        (x < border + 3 * u || x >= S - border - 3 * u || y < border + 3 * u || y >= S - border - 3 * u);
      const dChevron = Math.min(
        segDist(x, y, ax1, ay1, apexX, apexY),
        segDist(x, y, apexX, apexY, ax2, ay2)
      );
      const inChevron = dChevron <= thick / 2;
      const inBar = x >= barX1 && x <= barX2 && y >= barY - thick / 2 && y <= barY + thick / 2;
      const [r, g, b] = inBorder || inChevron || inBar ? GREEN : BG;
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }
  return png(S, S, rgba);
}

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), drawIcon(size));
  console.log(`icon-${size}.png written`);
}
