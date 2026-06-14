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

function countPixels(
  image: PngImage,
  predicate: (red: number, green: number, blue: number, alpha: number) => boolean,
) {
  let count = 0;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (
      predicate(
        image.data[offset],
        image.data[offset + 1],
        image.data[offset + 2],
        image.data[offset + 3],
      )
    ) {
      count += 1;
    }
  }
  return count;
}

test('brand mark matches the white Todo Matrix tile with a checked orange quadrant', () => {
  const image = readRgbaPng('assets/branding/todo-matrix-mark.png');
  const whitePixels = countPixels(
    image,
    (red, green, blue, alpha) =>
      alpha > 240 && red > 245 && green > 245 && blue > 245,
  );
  const orangePixels = countPixels(
    image,
    (red, green, blue, alpha) =>
      alpha > 240 && red > 220 && green > 80 && green < 190 && blue < 80,
  );
  const greenPixels = countPixels(
    image,
    (red, green, blue, alpha) =>
      alpha > 240 && red < 80 && green > 150 && blue > 80 && blue < 190,
  );
  const bluePixels = countPixels(
    image,
    (red, green, blue, alpha) =>
      alpha > 240 && red < 80 && green > 80 && green < 180 && blue > 190,
  );
  const pinkPixels = countPixels(
    image,
    (red, green, blue, alpha) =>
      alpha > 240 && red > 200 && green < 100 && blue > 60 && blue < 170,
  );
  let checkedWhitePixels = 0;
  for (let y = Math.round(image.height * 0.25); y < Math.round(image.height * 0.42); y += 1) {
    for (let x = Math.round(image.width * 0.25); x < Math.round(image.width * 0.45); x += 1) {
      const offset = (y * image.width + x) * 4;
      if (
        image.data[offset + 3] > 240 &&
        image.data[offset] > 245 &&
        image.data[offset + 1] > 245 &&
        image.data[offset + 2] > 245
      ) {
        checkedWhitePixels += 1;
      }
    }
  }

  assert.ok(whitePixels > image.width * image.height * 0.2, 'white tile/check is missing');
  assert.ok(
    checkedWhitePixels > image.width * image.height * 0.005,
    'white checkmark is missing from the orange quadrant',
  );
  assert.ok(orangePixels > image.width * image.height * 0.06, 'orange quadrant is missing');
  assert.ok(greenPixels > image.width * image.height * 0.06, 'green quadrant is missing');
  assert.ok(bluePixels > image.width * image.height * 0.06, 'blue quadrant is missing');
  assert.ok(pinkPixels > image.width * image.height * 0.06, 'pink quadrant is missing');
});

test('service worker invalidates the previous cached brand assets', () => {
  const serviceWorker = readFileSync('public/sw.js', 'utf8');
  const indexHtml = readFileSync('index.html', 'utf8');
  const manifest = readFileSync('public/manifest.webmanifest', 'utf8');
  assert.match(serviceWorker, /const CACHE_VERSION = 'v4';/);
  assert.match(indexHtml, /favicon\.ico\?v=4/);
  assert.match(indexHtml, /manifest\.webmanifest\?v=4/);
  assert.match(manifest, /icon-192\.png\?v=4/);
  assert.match(manifest, /icon-512\.png\?v=4/);
});

test('browser favicons use binary transparency instead of translucent outer pixels', () => {
  for (const path of ['public/favicon-32.png', 'public/favicon-64.png']) {
    const image = readRgbaPng(path);
    for (let offset = 3; offset < image.data.length; offset += 4) {
      const alpha = image.data[offset];
      assert.equal(
        alpha === 0 || alpha === 255,
        true,
        `${path} contains a translucent favicon pixel with alpha ${alpha}`,
      );
    }
  }
});

test('all platform icons omit the outer drop shadow', () => {
  for (const path of [
    'assets/branding/todo-matrix-icon-1024.png',
    'public/apple-touch-icon.png',
    'public/icons/icon-192.png',
    'public/icons/icon-512.png',
    ...['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].flatMap((density) =>
      ['ic_launcher.png', 'ic_launcher_foreground.png', 'ic_launcher_round.png'].map(
        (fileName) => `android/app/src/main/res/mipmap-${density}/${fileName}`,
      ),
    ),
  ]) {
    const image = readRgbaPng(path);
    const samples = [
      alphaAt(image, Math.round(image.width * 0.5), Math.round(image.height * 0.98)),
      alphaAt(image, Math.round(image.width * 0.02), Math.round(image.height * 0.5)),
      alphaAt(image, Math.round(image.width * 0.98), Math.round(image.height * 0.5)),
    ];
    assert.equal(
      samples.every((alpha) => alpha <= 8),
      true,
      `${path} must not contain a visible outer drop shadow`,
    );
  }
});

test('Android adaptive foreground uses centered tiles without the white card', () => {
  for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    const path = `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`;
    const image = readRgbaPng(path);
    const whitePixels = countPixels(
      image,
      (red, green, blue, alpha) =>
        alpha > 240 && red > 245 && green > 245 && blue > 245,
    );
    let strayWhitePixels = 0;
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const offset = (y * image.width + x) * 4;
        if (
          (x >= image.width / 2 || y >= image.height / 2) &&
          image.data[offset + 3] > 240 &&
          image.data[offset] > 245 &&
          image.data[offset + 1] > 245 &&
          image.data[offset + 2] > 245
        ) {
          strayWhitePixels += 1;
        }
      }
    }

    const opaqueCoordinates: Array<[number, number]> = [];
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        if (alphaAt(image, x, y) > 8) {
          opaqueCoordinates.push([x, y]);
        }
      }
    }

    const xs = opaqueCoordinates.map(([x]) => x);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const contentCenter = (left + right) / 2;
    const canvasCenter = (image.width - 1) / 2;

    assert.ok(
      whitePixels < image.width * image.height * 0.02,
      `${path} must not include the full white card in the adaptive foreground`,
    );
    assert.equal(
      strayWhitePixels,
      0,
      `${path} must not retain white card pixels around the colored tiles`,
    );
    assert.ok(
      Math.abs(contentCenter - canvasCenter) <= 1,
      `${path} foreground must be horizontally centered`,
    );
    assert.ok(
      (right - left + 1) / image.width <= 0.44,
      `${path} foreground must preserve the Android adaptive-icon safe margin`,
    );
  }
});

test('Android adaptive icon background is pure white', () => {
  const background = readFileSync(
    'android/app/src/main/res/values/ic_launcher_background.xml',
    'utf8',
  );
  assert.match(background, /#FFFFFF/i);
});

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

  }
});
