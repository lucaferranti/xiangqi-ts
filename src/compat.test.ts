import { expect, test } from '@jest/globals';
import { xiangqigroundDests, xiangqigroundMove } from './compat.js';
import { parseFen } from './fen.js';
import { Xiangqi } from './xiangqi.js';

test('xiangqiground dests', () => {
  const setup = parseFen('1cbak4/9/n2a5/2p1p3p/5cp2/2n2N3/6PCP/3AB4/2C6/3A1K1N1 w - - 0 1').unwrap();
  const pos = Xiangqi.fromSetup(setup).unwrap();
  const dests = xiangqigroundDests(pos);
  const _dests = new Map([
    ['f1', ['e1']],
    ['h1', ['f2']],
    ['c2', ['f2']],
    ['f5', ['g3', 'd4', 'd6', 'h6']],
  ]);
  expect(dests).toEqual(_dests);
});

test('xiangqiground moves', () => {
  expect(xiangqigroundMove({ from: 0, to: 9 })).toEqual(['a1', 'a2']);
});
