// Minimal dependency-free QR encoder: byte mode, error correction M or H, versions 1-5.
(function (global) {
  'use strict';

  // [ecCodewordsPerBlock, group1Blocks, group1DataPerBlock, group2Blocks, group2DataPerBlock]
  const EC_TABLE = {
    M: [null, [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0]],
    H: [null, [17, 1, 9, 0, 0], [28, 1, 16, 0, 0], [22, 2, 13, 0, 0], [16, 4, 9, 0, 0], [22, 2, 11, 2, 12]]
  };
  const ALIGNMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30]];
  const FORMAT_LEVEL = { M: 0, H: 2 };
  const MAX_VERSION = 5;
  const PAD_BYTES = [0xec, 0x11];
  const MASKS = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0
  ];
  const FINDER_PENALTY_A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const FINDER_PENALTY_B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

  const GF_EXP = new Array(512);
  const GF_LOG = new Array(256);
  (function initGaloisField() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();

  function gfMul(a, b) {
    return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsDivisor(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
      }
      poly = next;
    }
    return poly.slice(1);
  }

  function rsRemainder(data, divisor) {
    const result = new Array(divisor.length).fill(0);
    for (const byte of data) {
      const factor = byte ^ result.shift();
      result.push(0);
      divisor.forEach((coef, i) => {
        result[i] ^= gfMul(coef, factor);
      });
    }
    return result;
  }

  function dataCodewords(version, level) {
    const [, g1Blocks, g1Data, g2Blocks, g2Data] = EC_TABLE[level][version];
    return g1Blocks * g1Data + g2Blocks * g2Data;
  }

  function encodeData(bytes, version, level) {
    const bits = [];
    const push = (value, length) => {
      for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    };
    const capacityBits = dataCodewords(version, level) * 8;
    push(0b0100, 4);
    push(bytes.length, 8);
    bytes.forEach((b) => push(b, 8));
    push(0, Math.min(4, capacityBits - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let value = 0;
      for (let k = 0; k < 8; k++) value = (value << 1) | bits[i + k];
      codewords.push(value);
    }
    for (let pad = 0; codewords.length < capacityBits / 8; pad++) {
      codewords.push(PAD_BYTES[pad % 2]);
    }
    return codewords;
  }

  function addErrorCorrection(data, version, level) {
    const [ecLength, g1Blocks, g1Data, g2Blocks, g2Data] = EC_TABLE[level][version];
    const divisor = rsDivisor(ecLength);
    const blocks = [];
    let offset = 0;
    for (let i = 0; i < g1Blocks + g2Blocks; i++) {
      const length = i < g1Blocks ? g1Data : g2Data;
      const block = data.slice(offset, offset + length);
      offset += length;
      blocks.push({ data: block, ec: rsRemainder(block, divisor) });
    }

    const result = [];
    const maxData = Math.max(g1Data, g2Data);
    for (let i = 0; i < maxData; i++) {
      blocks.forEach((b) => {
        if (i < b.data.length) result.push(b.data[i]);
      });
    }
    for (let i = 0; i < ecLength; i++) {
      blocks.forEach((b) => result.push(b.ec[i]));
    }
    return result;
  }

  function createMatrix(version) {
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, dark) => {
      modules[y][x] = dark;
      isFunction[y][x] = true;
    };

    const finder = (ox, oy) => {
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          const x = ox + j;
          const y = oy + i;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const dist = Math.max(Math.abs(i - 3), Math.abs(j - 3));
          set(x, y, dist <= 3 && dist !== 2);
        }
      }
    };
    finder(0, 0);
    finder(size - 7, 0);
    finder(0, size - 7);

    for (let i = 8; i < size - 8; i++) {
      set(6, i, i % 2 === 0);
      set(i, 6, i % 2 === 0);
    }

    const centers = ALIGNMENT[version];
    const last = centers[centers.length - 1];
    for (const cy of centers) {
      for (const cx of centers) {
        if ((cx === 6 && cy === 6) || (cx === 6 && cy === last) || (cx === last && cy === 6)) continue;
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            set(cx + j, cy + i, Math.max(Math.abs(i), Math.abs(j)) !== 1);
          }
        }
      }
    }

    for (let i = 0; i <= 8; i++) {
      if (i === 6) continue;
      set(8, i, false);
      set(i, 8, false);
    }
    for (let i = 0; i < 8; i++) {
      set(size - 1 - i, 8, false);
      set(8, size - 1 - i, false);
    }
    set(8, size - 8, true);

    return { size, modules, isFunction };
  }

  function placeData(modules, isFunction, codewords) {
    const size = modules.length;
    const total = codewords.length * 8;
    let bitIndex = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!isFunction[y][x] && bitIndex < total) {
            modules[y][x] = ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
            bitIndex++;
          }
        }
      }
    }
  }

  function formatBits(level, mask) {
    const data = (FORMAT_LEVEL[level] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    return ((data << 10) | rem) ^ 0x5412;
  }

  function drawFormat(modules, bits) {
    const size = modules.length;
    const bit = (i) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) modules[i][8] = bit(i);
    modules[7][8] = bit(6);
    modules[8][8] = bit(7);
    modules[8][7] = bit(8);
    for (let i = 9; i < 15; i++) modules[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = bit(i);
  }

  function applyMask(modules, isFunction, mask) {
    const test = MASKS[mask];
    modules.forEach((row, y) => {
      row.forEach((_, x) => {
        if (!isFunction[y][x] && test(x, y)) row[x] = !row[x];
      });
    });
  }

  function runPenalty(size, get) {
    let score = 0;
    for (let a = 0; a < size; a++) {
      let run = 1;
      let prev = get(a, 0);
      for (let b = 1; b < size; b++) {
        const cur = get(a, b);
        if (cur === prev) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else {
          run = 1;
          prev = cur;
        }
      }
      for (let b = -4; b <= size - 7; b++) {
        let matchA = true;
        let matchB = true;
        for (let k = 0; k < 11; k++) {
          const v = get(a, b + k) ? 1 : 0;
          if (v !== FINDER_PENALTY_A[k]) matchA = false;
          if (v !== FINDER_PENALTY_B[k]) matchB = false;
          if (!matchA && !matchB) break;
        }
        if (matchA || matchB) score += 40;
      }
    }
    return score;
  }

  function penalty(modules) {
    const size = modules.length;
    const inside = (r, c) => r >= 0 && c >= 0 && r < size && c < size;
    const row = (a, b) => inside(a, b) && modules[a][b];
    const col = (a, b) => inside(b, a) && modules[b][a];
    let score = runPenalty(size, row) + runPenalty(size, col);

    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
      }
    }

    let dark = 0;
    modules.forEach((r) => r.forEach((v) => {
      if (v) dark++;
    }));
    const total = size * size;
    score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  }

  function encode(text, level = 'M') {
    if (!EC_TABLE[level]) throw new Error(`QR: unsupported error correction level ${level}`);
    const bytes = Array.from(new TextEncoder().encode(String(text)));

    let version = 1;
    while (version <= MAX_VERSION && bytes.length > Math.floor((dataCodewords(version, level) * 8 - 12) / 8)) {
      version++;
    }
    if (version > MAX_VERSION) throw new Error('QR: text is too long');

    const codewords = addErrorCorrection(encodeData(bytes, version, level), version, level);
    const base = createMatrix(version);
    placeData(base.modules, base.isFunction, codewords);

    let best = null;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < MASKS.length; mask++) {
      const modules = base.modules.map((row) => row.slice());
      applyMask(modules, base.isFunction, mask);
      drawFormat(modules, formatBits(level, mask));
      const p = penalty(modules);
      if (p < bestPenalty) {
        bestPenalty = p;
        best = modules;
      }
    }
    return best;
  }

  function toSvg(text, { level = 'M', margin = 4, color = '#000000', background = '#ffffff' } = {}) {
    const modules = encode(text, level);
    const view = modules.length + margin * 2;
    let path = '';
    modules.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) path += `M${x + margin},${y + margin}h1v1h-1z`;
      });
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view} ${view}" shape-rendering="crispEdges">` +
      `<rect width="${view}" height="${view}" fill="${background}"/>` +
      `<path d="${path}" fill="${color}"/></svg>`;
  }

  global.QR = { encode, toSvg };
})(typeof window !== 'undefined' ? window : globalThis);
