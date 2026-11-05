import { deflateSync } from 'node:zlib';

// Real, small PNGs synthesized locally. No borrowed student documents or AI output.
function answerImage(second: boolean) {
  const crc32 = (data: Buffer) => {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const name = Buffer.from(type);
    const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([size, name, data, checksum]);
  };
  const width = 80, height = 110;
  const pixels = Buffer.alloc((1 + width * 3) * height, 255);
  for (let y = 0; y < height; y++) {
    pixels[y * (1 + width * 3)] = 0;
    for (let x = 0; x < width; x++) if ((y > 20 && y < 24 && x > 10 && x < (second ? 65 : 40)) || (x > 35 && x < 39 && y > 20 && y < 75)) {
      const offset = y * (1 + width * 3) + 1 + x * 3;
      pixels[offset] = second ? 25 : 180; pixels[offset + 1] = 35; pixels[offset + 2] = second ? 180 : 25;
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  return 'data:image/png;base64,' + Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}

export const historyFixture = {
  manuscriptKey: 'growing-handwriting-v1:13000000-0000-4000-8000-000000000101',
  questionId: '13000000-0000-4000-8000-000000000102',
  paperId: '13000000-0000-4000-8000-000000000103',
  rewardKey: 'growing-unit-rewards-v1:math-8a-01',
  answerImages: [answerImage(false), answerImage(true)],
  at: '2026-11-05T00:00:00.000Z'
};

export function manuscript() {
  return {
    version: 1, unitId: 'math-8a-01', subject: 'math', mode: 'solution', prompt: '合成验收：画出三角形中线',
    pages: [[{ tool: 'pen', width: 4, points: [[100,100,0.5], [200,250,0.7], [300,100,0.5]] }]],
    revision: 2, recognition: null,
    grades: [
      { revision: 1, at: '2026-11-04T00:00:00.000Z', score: 45, parts: [10,10,10,15], feedback: '第一次点评：中线不要求垂直', needsReview: false },
      { revision: 2, at: historyFixture.at, score: null, parts: null, feedback: '第二次点评：当前原稿需人工复核', needsReview: true }
    ], updatedAt: historyFixture.at
  };
}
