import { expect, test } from '@jest/globals';
import { perft } from './debug.js';
import { makeFen, parseFen } from './fen.js';
import { isImpossibleCheck, Xiangqi } from './xiangqi.js';

test('readme example', () => {
  const setup = parseFen(
    '1nbakabn1/r7r/1c7/p1p1C1p1p/4C2c1/9/P1P1P1P1P/9/9/RNBAKABNR b - - 4 4',
  ).unwrap();
  const pos = Xiangqi.fromSetup(setup).unwrap();
  expect(pos.isCheckmate()).toBe(true);
});

// taken from https://www.chessprogramming.org/Chinese_Chess_Perft_Results
const perft_tests: [string, string, number, number, number, number?, number?][] = [
  [
    'pos-1',
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    44,
    1920,
    79_666,
    3_290_240,
    133_312_995,
  ],
  [
    'pos-2',
    'r1ba1a3/4kn3/2n1b4/pNp1p1p1p/4c4/6P2/P1P2R2P/1CcC5/9/2BAKAB2 w - - 0 1',
    38,
    1128,
    43_929,
    1_339_047,
    53_112_976,
  ],
  ['pos-3', '1cbak4/9/n2a5/2p1p3p/5cp2/2n2N3/6PCP/3AB4/2C6/3A1K1N1 w - - 0 1', 7, 281, 8620, 326_201, 10_369_923],
  ['pos-4', '5a3/3k5/3aR4/9/5r3/5n3/9/3A1A3/5K3/2BC2B2 w - - 0 1', 25, 424, 9850, 202_884, 4_739_553],
  ['pos-5', 'CRN1k1b2/3ca4/4ba3/9/2nr5/9/9/4B4/4A4/4KA3 w - - 0 1', 28, 516, 14_808, 395_483, 11_842_230],
  ['pos-6', 'R1N1k1b2/9/3aba3/9/2nr5/2B6/9/4B4/4A4/4KA3 w - - 0 1', 21, 364, 7626, 162_837, 3_500_505],
  ['pos-7', 'C1nNk4/9/9/9/9/9/n1pp5/B3C4/9/3A1K3 w - - 0 1', 28, 222, 6_241, 64_971, 1_914_306],
  ['pos-8', '4ka3/4a4/9/9/4N4/p8/9/4C3c/7n1/2BK5 w - - 0 1', 23, 345, 8_124, 149_272, 3_513_104],
  ['pos-9', '2b1ka3/9/b3N4/4n4/9/9/9/4C4/2p6/2BK5 w - - 0 1', 21, 195, 3883, 48_060, 933_096],
  ['pos-10', '1C2ka3/9/C1Nab1n2/p3p3p/6p2/9/P3P3P/3AB4/3p2c2/c1BAK4 w - - 0 1', 30, 830, 22_787, 649_866, 17_920_736],
  ['pos-11', 'CnN1k1b2/c3a4/4ba3/9/2nr5/9/9/4C4/4A4/4KA3 w - - 0 1', 19, 583, 11_714, 376_467, 8_148_177],
];

test('play move', () => {
  const pos = Xiangqi.fromSetup(parseFen('4k4/9/9/4p4/9/9/4P4/9/9/4K4 w - - 0 1').unwrap()).unwrap();

  const kd1 = pos.clone();
  kd1.play({ from: 4, to: 3 });
  expect(makeFen(kd1.toSetup())).toBe('4k4/9/9/4p4/9/9/4P4/9/9/3K5 b - - 1 1');

  const pe5 = pos.clone();
  pe5.play({ from: 31, to: 40 });
  expect(makeFen(pe5.toSetup())).toBe('4k4/9/9/4p4/9/4P4/9/9/9/4K4 b - - 1 1');
});

test.each(perft_tests)('perft tests: %s: %s', (_, fen, d1, d2, d3) => {
  const pos = Xiangqi.fromSetup(parseFen(fen).unwrap()).unwrap();
  expect(perft(pos, 1, false)).toBe(d1);
  expect(perft(pos, 2, false)).toBe(d2);
  expect(perft(pos, 3, false)).toBe(d3);
});

const insufficientMaterial: [string, boolean, boolean][] = [
  ['4k4/9/9/9/9/9/9/9/9/3K5 w - - 0 1', true, true],
  ['2bakab2/9/9/9/9/9/9/9/9/2BK1A3 b - - 0 1', true, true],
  ['1rbakab2/9/9/9/9/9/9/9/9/2BK1A3 b - - 0 1', true, false],
  ['3ck4/9/9/9/9/9/9/9/9/3KC4 w - - 0 1', true, true],
  ['2bck1b2/9/9/9/9/9/9/9/9/2BK1C3 b - - 0 1', true, true],
  ['2bckab2/9/9/9/9/9/9/9/9/2BK1C3 b - - 0 1', false, false],
  ['4k3P/9/9/9/9/9/9/9/8p/3K5 w - - 0 1', true, false],
  ['1rbakab2/9/9/9/9/9/9/9/9/2BK1A2N b - - 0 1', false, false],
];

test('insufficient material', () => {
  for (const [fen, red, black] of insufficientMaterial) {
    const pos = Xiangqi.fromSetup(parseFen(fen).unwrap()).unwrap();
    expect(pos.hasInsufficientMaterial('red')).toBe(red);
    expect(pos.hasInsufficientMaterial('black')).toBe(black);
  }
});

test('checks', () => {
  // check with promoted pawn
  const pos1 = Xiangqi.fromSetup(parseFen('2b1ka3/9/b3N4/4n4/9/9/9/4C4/2pK5/2B6 w - - 0 1').unwrap()).unwrap();
  expect(pos1.isCheck()).toBe(true);

  // triple check is possible
  const pos2 = Xiangqi.fromSetup(parseFen('9/4k4/9/2N6/9/9/9/4R4/4C4/4K4 b - - 0 1').unwrap()).unwrap();
  expect(pos2.isCheck()).toBe(true);
  expect(isImpossibleCheck(pos1)).toBe(false);

  // quadruple check is possible
  const pos3 = Xiangqi.fromSetup(parseFen('4k4/3PR1N2/5N3/4C4/9/9/9/9/9/4K4 b - - 0 1').unwrap()).unwrap();
  expect(pos3.isCheck()).toBe(true);
  expect(isImpossibleCheck(pos2)).toBe(false);
});
