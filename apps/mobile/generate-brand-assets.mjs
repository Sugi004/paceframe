import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(process.cwd(), 'apps/mobile/assets');
fs.mkdirSync(root, { recursive: true });

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function writePng(filePath, width, height, pixelWriter) {
  const rows = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    rows[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = pixelWriter(x, y, width, height);
      const offset = rowStart + 1 + x * 4;
      rows[offset] = pixel[0];
      rows[offset + 1] = pixel[1];
      rows[offset + 2] = pixel[2];
      rows[offset + 3] = pixel[3];
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
}

function blend(bottom, top, alpha) {
  return Math.round(bottom * (1 - alpha) + top * alpha);
}

function gradientBackground(x, y, width, height) {
  const navy = [9, 18, 33];
  const deepBlue = [18, 35, 71];
  const goldGlow = [255, 211, 110];
  const cyanGlow = [142, 217, 255];
  const t = y / Math.max(height - 1, 1);
  let r = blend(navy[0], deepBlue[0], t * 0.55);
  let g = blend(navy[1], deepBlue[1], t * 0.55);
  let b = blend(navy[2], deepBlue[2], t * 0.55);

  const dxGold = x - width * 0.72;
  const dyGold = y - height * 0.22;
  const goldDistance = Math.sqrt(dxGold * dxGold + dyGold * dyGold);
  const goldFalloff = Math.max(0, 1 - goldDistance / (width * 0.58));

  const dxCyan = x - width * 0.25;
  const dyCyan = y - height * 0.82;
  const cyanDistance = Math.sqrt(dxCyan * dxCyan + dyCyan * dyCyan);
  const cyanFalloff = Math.max(0, 1 - cyanDistance / (width * 0.72));

  r = blend(r, goldGlow[0], goldFalloff * 0.18);
  g = blend(g, goldGlow[1], goldFalloff * 0.14);
  b = blend(b, goldGlow[2], goldFalloff * 0.08);

  r = blend(r, cyanGlow[0], cyanFalloff * 0.1);
  g = blend(g, cyanGlow[1], cyanFalloff * 0.12);
  b = blend(b, cyanGlow[2], cyanFalloff * 0.18);

  return [r, g, b, 255];
}

function drawRoundedRect(x, y, left, top, width, height, radius) {
  const right = left + width;
  const bottom = top + height;
  if (x >= left + radius && x <= right - radius && y >= top && y <= bottom) {
    return true;
  }
  if (x >= left && x <= right && y >= top + radius && y <= bottom - radius) {
    return true;
  }

  const corners = [
    [left + radius, top + radius],
    [right - radius, top + radius],
    [left + radius, bottom - radius],
    [right - radius, bottom - radius]
  ];

  return corners.some(([cx, cy]) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= radius * radius;
  });
}

function drawCircle(x, y, cx, cy, radius) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function logoLayers(x, y, width, height, scale = 1, transparent = false) {
  const centerX = width / 2;
  const centerY = height / 2;
  const coreRadius = 112 * scale;
  const coreStroke = 18 * scale;
  const beamThickness = 56 * scale;
  const beamLength = 190 * scale;
  const beamRadius = beamThickness / 2;
  const beamColor = [255, 211, 110, 255];
  const coreColor = [13, 24, 52, 255];
  const strokeColor = [247, 251, 255, 230];
  const glowColor = [255, 125, 74, 255];

  let pixel = transparent ? [0, 0, 0, 0] : gradientBackground(x, y, width, height);

  const glowDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const glowFalloff = Math.max(0, 1 - glowDistance / (width * 0.36));
  if (!transparent && glowFalloff > 0) {
    pixel = [
      blend(pixel[0], glowColor[0], glowFalloff * 0.08),
      blend(pixel[1], glowColor[1], glowFalloff * 0.05),
      blend(pixel[2], glowColor[2], glowFalloff * 0.02),
      255
    ];
  }

  const topBeam = drawRoundedRect(x, y, centerX - beamThickness / 2, centerY - beamLength - 72 * scale, beamThickness, beamLength, beamRadius);
  const rightBeam = drawRoundedRect(x, y, centerX + 72 * scale, centerY - beamThickness / 2, beamLength, beamThickness, beamRadius);
  const bottomBeam = drawRoundedRect(x, y, centerX - beamThickness / 2, centerY + 72 * scale, beamThickness, beamLength, beamRadius);

  if (topBeam || rightBeam || bottomBeam) {
    pixel = beamColor;
  }

  const inOuterCore = drawCircle(x, y, centerX, centerY, coreRadius);
  const inInnerCore = drawCircle(x, y, centerX, centerY, coreRadius - coreStroke);
  if (inOuterCore) {
    pixel = inInnerCore ? coreColor : strokeColor;
  }

  return pixel;
}

function drawWordmark(x, y, width, height) {
  const letterColor = [247, 251, 255, 255];
  const textTop = height * 0.72;
  const scale = width / 1024;
  const unit = 12 * scale;
  const gap = 14 * scale;
  const letters = {
    P: [
      [0, 0, 1, 7],
      [1, 0, 4, 1],
      [4, 1, 1, 2],
      [1, 3, 3, 1],
      [0, 3, 1, 1]
    ],
    A: [
      [0, 2, 1, 5],
      [1, 1, 1, 1],
      [2, 0, 2, 1],
      [4, 1, 1, 6],
      [1, 3, 3, 1]
    ],
    C: [
      [1, 0, 4, 1],
      [0, 1, 1, 5],
      [1, 6, 4, 1]
    ],
    E: [
      [0, 0, 1, 7],
      [1, 0, 4, 1],
      [1, 3, 3, 1],
      [1, 6, 4, 1]
    ],
    F: [
      [0, 0, 1, 7],
      [1, 0, 4, 1],
      [1, 3, 3, 1]
    ],
    R: [
      [0, 0, 1, 7],
      [1, 0, 3, 1],
      [4, 1, 1, 2],
      [1, 3, 3, 1],
      [3, 4, 1, 1],
      [4, 5, 1, 2]
    ],
    M: [
      [0, 0, 1, 7],
      [4, 0, 1, 7],
      [1, 1, 1, 2],
      [2, 2, 1, 2],
      [3, 1, 1, 2]
    ]
  };

  const text = 'PACEFRAME';
  const letterWidth = 5 * unit;
  const startX = (width - (text.length * letterWidth + (text.length - 1) * gap)) / 2;

  for (let i = 0; i < text.length; i += 1) {
    const letter = letters[text[i]];
    if (!letter) {
      continue;
    }
    const left = startX + i * (letterWidth + gap);
    for (const [gx, gy, gw, gh] of letter) {
      const rectLeft = left + gx * unit;
      const rectTop = textTop + gy * unit;
      if (x >= rectLeft && x < rectLeft + gw * unit && y >= rectTop && y < rectTop + gh * unit) {
        return letterColor;
      }
    }
  }

  return null;
}

writePng(path.join(root, 'icon.png'), 1024, 1024, (x, y, width, height) => logoLayers(x, y, width, height, 1));

writePng(path.join(root, 'adaptive-icon-background.png'), 1024, 1024, (x, y, width, height) =>
  gradientBackground(x, y, width, height)
);

writePng(path.join(root, 'adaptive-icon-foreground.png'), 1024, 1024, (x, y, width, height) =>
  logoLayers(x, y, width, height, 0.94, true)
);

writePng(path.join(root, 'splash-icon.png'), 1242, 2688, (x, y, width, height) => {
  const base = gradientBackground(x, y, width, height);
  const logo = logoLayers(x, y, width, height, 1.05, true);
  if (logo[3] > 0) {
    return logo;
  }

  const wordmark = drawWordmark(x, y, width, height);
  if (wordmark) {
    return wordmark;
  }

  return base;
});

console.log(`Generated brand assets in ${root}`);
