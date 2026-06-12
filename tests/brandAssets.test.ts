import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inflateSync } from 'node:zlib';

interface PngImage {
  data: Buffer;
  height: number;
  width: number;
}

function readRgbaPng(path: string): PngImage {
  const file = readFileSync(path);
  const signature = file.subarray(0, 8);
  assert.deepEqual(signature, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const compressed: Buffer[] = [];

  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const chunk = file.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      assert.equal(chunk[8], 8, `${path} must use 8-bit PNG channels`);
      colorType = chunk[9];
      assert.equal(colorType, 6, `${path} must be an RGBA PNG`);
      assert.equal(chunk[12], 0, `${path} must not be interlaced`);
    } else if (type === 'IDAT') {
      compressed.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
  }

  assert.equal(colorType, 6);
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const raw = inflateSync(Buffer.concat(compressed));
  const data = Buffer.alloc(width * height * bytesPerPixel);

  let rawOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawOffset];
    rawOffset += 1;
    const rowOffset = y * stride;

    for (let x = 0; x < stride; x += 1) {
      const value = raw[rawOffset + x];
      const left = x >= bytesPerPixel ? data[rowOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? data[rowOffset + x - stride] : 0;
      const upLeft =
        y > 0 && x >= bytesPerPixel ? data[rowOffset + x - stride - bytesPerPixel] : 0;

      if (filter === 0) data[rowOffset + x] = value;
      else if (filter === 1) data[rowOffset + x] = (value + left) & 0xff;
      else if (filter === 2) data[rowOffset + x] = (value + up) & 0xff;
      else if (filter === 3) data[rowOffset + x] = (value + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const estimate = left + up - upLeft;
        const leftDistance = Math.abs(estimate - left);
        const upDistance = Math.abs(estimate - up);
        const diagonalDistance = Math.abs(estimate - upLeft);
        const predictor =
          leftDistance <= upDistance && leftDistance <= diagonalDistance
            ? left
            : upDistance <= diagonalDistance
              ? up
              : upLeft;
        data[rowOffset + x] = (value + predictor) & 0xff;
      } else {
        assert.fail(`${path} uses unsupported PNG filter ${filter}`);
      }
    }

    rawOffset += stride;
  }

  return { data, height, width };
}

function alphaAt(image: PngImage, x: number, y: number) {
  return image.data[(y * image.width + x) * 4 + 3];
}

test('brand and web icons use transparent outer edges', () => {
  const paths = [
    'assets/branding/todo-matrix-icon-source.png',
    'assets/branding/todo-matrix-icon-1024.png',
    'assets/branding/todo-matrix-mark.png',
    'public/favicon-32.png',
    'public/favicon-64.png',
    'public/apple-touch-icon.png',
    'public/icons/icon-192.png',
    'public/icons/icon-512.png',
    'public/icons/icon-maskable-512.png',
    ...['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].flatMap((density) =>
      ['ic_launcher.png', 'ic_launcher_foreground.png', 'ic_launcher_round.png'].map(
        (fileName) => `android/app/src/main/res/mipmap-${density}/${fileName}`,
      ),
    ),
  ];

  for (const path of paths) {
    const image = readRgbaPng(path);
    const corners = [
      alphaAt(image, 0, 0),
      alphaAt(image, image.width - 1, 0),
      alphaAt(image, 0, image.height - 1),
      alphaAt(image, image.width - 1, image.height - 1),
    ];
    assert.deepEqual(corners, [0, 0, 0, 0], `${path} must have transparent corners`);

    for (let offset = 0; offset < image.data.length; offset += 4) {
      const red = image.data[offset];
      const green = image.data[offset + 1];
      const blue = image.data[offset + 2];
      const alpha = image.data[offset + 3];
      const hasVisibleWhiteFringe =
        alpha > 16 && alpha < 255 && red > 220 && green > 220 && blue > 220;
      assert.equal(hasVisibleWhiteFringe, false, `${path} must not contain a white alpha fringe`);
    }
  }
});
