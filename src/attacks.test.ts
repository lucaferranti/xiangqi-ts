import { expect, test } from '@jest/globals';
import {
  advisorAttacks,
  between,
  cannonAttacks,
  chariotAttacks,
  elephantAttacks,
  horseAttacks,
  kingAttacks,
  pawnAttacks,
  ray,
} from './attacks.js';
import { SquareSet } from './squareSet.js';

test('ray', () => {
  expect(ray(0, 9).equals(SquareSet.fromFile(0))).toBe(true);
});

test('pawn attacks', () => {
  expect(Array.from(pawnAttacks('red', 40))).toEqual([49]);
  expect(Array.from(pawnAttacks('red', 49))).toEqual([48, 50, 58]);
  expect(Array.from(pawnAttacks('black', 49))).toEqual([40]);
  expect(Array.from(pawnAttacks('black', 40))).toEqual([31, 39, 41]);

  expect(Array.from(pawnAttacks('red', 89))).toEqual([88]);
  expect(Array.from(pawnAttacks('red', 72))).toEqual([73, 81]);
  expect(Array.from(pawnAttacks('red', 80))).toEqual([79, 89]);
});

test('king attacks', () => {
  expect(Array.from(kingAttacks('red', 3))).toEqual([4, 12]);
  expect(Array.from(kingAttacks('red', 13))).toEqual([4, 12, 14, 22]);
  expect(Array.from(kingAttacks('red', 23))).toEqual([14, 22]);

  expect(Array.from(kingAttacks('black', 85))).toEqual([76, 84, 86]);
  expect(Array.from(kingAttacks('black', 76))).toEqual([67, 75, 77, 85]);
  expect(Array.from(kingAttacks('black', 66))).toEqual([67, 75]);
});

test('advisor attacks', () => {
  expect(Array.from(advisorAttacks('red', 3))).toEqual([13]);
  expect(Array.from(advisorAttacks('red', 13))).toEqual([3, 5, 21, 23]);

  expect(Array.from(advisorAttacks('black', 76))).toEqual([66, 68, 84, 86]);
  expect(Array.from(advisorAttacks('black', 86))).toEqual([76]);
});

test('elelphant attacks', () => {
  expect(Array.from(elephantAttacks('red', 22, SquareSet.empty()))).toEqual([2, 6, 38, 42]);
  expect(Array.from(elephantAttacks('black', 63, SquareSet.empty()))).toEqual([47, 83]);

  expect(Array.from(elephantAttacks('red', 22, SquareSet.fromSquare(32)))).toEqual([2, 6, 38]);
  expect(Array.from(elephantAttacks('black', 63, SquareSet.fromSquare(73)))).toEqual([47]);

  expect(Array.from(elephantAttacks('red', 22, SquareSet.fromSquares(12, 14, 32, 30)))).toEqual([]);
});

test('horse attacks', () => {
  expect(Array.from(horseAttacks(8, SquareSet.empty()))).toEqual([15, 25]);
  expect(Array.from(horseAttacks(8, SquareSet.fromSquare(17)))).toEqual([15]);

  expect(Array.from(horseAttacks(22, SquareSet.empty()))).toEqual([3, 5, 11, 15, 29, 33, 39, 41]);
  expect(Array.from(horseAttacks(22, SquareSet.fromSquare(13)))).toEqual([11, 15, 29, 33, 39, 41]);
  expect(Array.from(horseAttacks(22, SquareSet.fromSquares(13, 21, 23, 31)))).toEqual([]);
});

test('chariot attacks', () => {
  expect(chariotAttacks(22, SquareSet.empty())).toEqual(SquareSet.fromFile(4).xor(SquareSet.fromRank(2)));
  expect(chariotAttacks(0, SquareSet.fromSquares(1, 9))).toEqual(SquareSet.fromSquares(1, 9));
  expect(chariotAttacks(22, SquareSet.fromFile(0))).toEqual(SquareSet.fromFile(4).xor(SquareSet.fromRank(2)));
  expect(chariotAttacks(22, SquareSet.fromFile(1))).toEqual(
    SquareSet.fromFile(4).xor(SquareSet.fromRank(2)).without(18),
  );
  expect(chariotAttacks(22, SquareSet.fromFile(1).xor(SquareSet.fromFile(0)))).toEqual(
    SquareSet.fromFile(4).xor(SquareSet.fromRank(2)).without(18),
  );
  expect(chariotAttacks(22, SquareSet.fromRank(2))).toEqual(SquareSet.fromFile(4).without(22).with(21).with(23));
});

test('cannon attacks', () => {
  expect(cannonAttacks(22, SquareSet.empty())).toEqual(SquareSet.fromFile(4).xor(SquareSet.fromRank(2)));
  expect(cannonAttacks(0, SquareSet.fromSquares(1, 9))).toEqual(SquareSet.empty());
  expect(cannonAttacks(0, SquareSet.fromSquares(1, 2, 9, 18))).toEqual(SquareSet.fromSquares(2, 18));
  expect(cannonAttacks(22, SquareSet.fromSquares(19, 24, 26, 49, 67))).toEqual(
    SquareSet.fromSquares(20, 21, 23, 26, 4, 13, 31, 40, 67),
  );
  expect(cannonAttacks(22, SquareSet.fromSquares(20, 24))).toEqual(SquareSet.fromFile(4).without(22).with(21).with(23));
  expect(cannonAttacks(22, SquareSet.fromSquares(18, 20, 24, 26))).toEqual(
    SquareSet.fromFile(4).without(22).union(SquareSet.fromSquares(18, 21, 23, 26)),
  );
});

test('between', () => {
  expect(between(42, 42)).toEqual(SquareSet.empty());
  expect(Array.from(between(0, 3))).toEqual([1, 2]);
  expect(Array.from(between(0, 18))).toEqual([9]);
  expect(Array.from(between(0, 27))).toEqual([9, 18]);

  expect(Array.from(between(87, 89))).toEqual([88]);
  expect(Array.from(between(61, 47))).toEqual([]);
});
