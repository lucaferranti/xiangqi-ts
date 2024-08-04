import { expect, test } from '@jest/globals';
import { parseFen } from './fen.js';
import { makeSan, makeSanVariation, parseSan } from './san.js';
import { parseUci } from './util.js';
import { Xiangqi } from './xiangqi.js';

test('make simple variation', () => {
  const pos = Xiangqi.default();
  const variation = 'h3e3 h10g8 h1g3'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe('1. Che3 Ng8 2. Ng3');
  expect(pos).toEqual(Xiangqi.default());
});

test('simple line with checks, captures, disambiguations and mate', () => {
  const pos = Xiangqi.default();
  const variation = 'h3e3 h8e8 e3e7 e8e4 h1g3 a10a9 g3e4 i10i9 e4c5 b8b1 b3e3'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe(
    '1. Che3 Che8 2. Cxe7+ Cxe4 3. Ng3 Ra9 4. Nxe4 Rii9 5. Nc5 Cxb1 6. Cbe3#',
  );

  const line = 'Che3 Che8 Cxe7+ Cxe4 Ng3 Ra9 Nxe4 Rii9 Nc5 Cxb1 Cbe3#'.split(' ');
  for (const idx of line.keys()) {
    const move = parseSan(pos, line[idx])!;
    expect(move).toEqual(variation[idx]);
    pos.play(move);
  }
});

test('parse basic san', () => {
  const pos = Xiangqi.default();
  expect(parseSan(pos, 'Cbe3')).toEqual(parseUci('b3e3'));
  expect(parseSan(pos, 'Ng3')).toEqual(parseUci('h1g3'));
  expect(parseSan(pos, 'Hg3')).toEqual(parseUci('h1g3'));
  expect(parseSan(pos, 'Ege3')).toEqual(parseUci('g1e3'));
  expect(parseSan(pos, 'Bge3')).toEqual(parseUci('g1e3'));
  expect(parseSan(pos, 'Ade2')).toEqual(parseUci('d1e2'));
  expect(parseSan(pos, 'Pe5')).toEqual(parseUci('e4e5'));
  expect(parseSan(pos, 'Cxb10')).toEqual(parseUci('b3b10'));
});

test('parse fools mate', () => {
  const pos = Xiangqi.default();
  const line = ['Che3', 'Ri9', 'Cxe7', 'Raa9', 'Cb5', 'Nc8', 'Cbe5#'];
  for (const san of line) {
    pos.play(parseSan(pos, san)!);
  }
  expect(pos.isCheckmate()).toBe(true);
});

test('overspecified pawn move', () => {
  const pos = Xiangqi.default();
  expect(parseSan(pos, 'P4e5')).toEqual({ from: 31, to: 40 });
});

test('parse and make move from different positions', () => {
  const fen_moves = [
    ['5k2r/r8/9/9/9/9/9/9/9/4K4 b - -', 'i10i9', 'Rii9'], // disambiguate by file first
    ['5k2r/9/9/9/9/9/9/9/8r/4K4 b - -', 'i10i3', 'R10i3'], // disambiguate by rank
    ['5k1rR/9/9/9/9/9/9/9/7r1/4K4 b - -', 'h2h3', 'Rh3'], // no disambiguation needed because one piece is pinned
    ['5k3/9/3P1P3/9/9/9/9/9/9/4K4 w - -', 'd8e8', 'Pde8'], // promoted pawn disambiguation
  ];
  for (const [fen, uci, san] of fen_moves) {
    const pos = Xiangqi.fromSetup(parseFen(fen).unwrap()).unwrap();
    const move = parseUci(uci)!;
    expect(parseSan(pos, san)).toEqual(move);
    expect(makeSan(pos, move)).toBe(san);
  }
});
