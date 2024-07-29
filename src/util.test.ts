import { expect, test } from '@jest/globals';
import { makeUci, parseUci } from './util.js';

test('parse uci', () => {
  expect(parseUci('a1a2')).toEqual({ from: 0, to: 9 });
  expect(parseUci('i1i10')).toEqual({ from: 8, to: 89 });
  expect(parseUci('a10b10')).toEqual({ from: 81, to: 82 });
});

test('make uci', () => {
  expect(makeUci({ from: 2, to: 3 })).toBe('c1d1');
  expect(makeUci({ from: 8, to: 89 })).toBe('i1i10');
});
