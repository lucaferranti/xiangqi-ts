import { expect, test } from '@jest/globals';
import { SquareSet } from './squareSet.js';

test('from square and to array', () => {
  for (let sq = 0; sq < 90; sq++) {
    expect(SquareSet.fromSquare(sq)).toEqual(SquareSet.empty().with(sq));
    expect(Array.from(SquareSet.fromSquare(sq))).toEqual([sq]);
  }
});

test('full set has all', () => {
  for (let square = 0; square < 90; square++) {
    expect(SquareSet.full().has(square)).toBe(true);
  }
  expect(Array.from(SquareSet.full())).toEqual(Array.from({ length: 90 }, (_, index) => index));
});

test('size', () => {
  let squares = SquareSet.empty();
  for (let i = 0; i < 90; i++) {
    expect(squares.size()).toBe(i);
    squares = squares.with(i);
  }
});

test('from rank', () => {
  for (let r = 0; r < 10; r++) {
    expect(Array.from(SquareSet.fromRank(r))).toEqual(Array.from({ length: 9 }, (_, f) => 9 * r + f));
  }
});

test('from file', () => {
  for (let f = 0; f < 9; f++) {
    expect(Array.from(SquareSet.fromFile(f))).toEqual(Array.from({ length: 10 }, (_, r) => 9 * r + f));
  }
});

test('first and last', () => {
  for (let sq = 0; sq < 90; sq++) {
    expect(SquareSet.fromSquare(sq).first()).toEqual(sq);
    expect(SquareSet.fromSquare(sq).with(89).first()).toEqual(sq);

    expect(SquareSet.fromSquare(sq).last()).toEqual(sq);
    expect(SquareSet.fromSquare(sq).with(0).last()).toEqual(sq);
  }
});

test('without first', () => {
  expect(SquareSet.empty().withoutFirst()).toEqual(SquareSet.empty());
  expect(SquareSet.full().withoutFirst()).toEqual(SquareSet.full().without(0));

  for (const sq of [0, 15, 32, 64, 89]) expect(SquareSet.fromSquare(sq).withoutFirst()).toEqual(SquareSet.empty());

  expect(SquareSet.fromSquares(0, 15, 32, 64, 89).withoutFirst()).toEqual(SquareSet.fromSquares(15, 32, 64, 89));
});

test('toggle with and without invariants', () => {
  for (let sq = 0; sq < 90; sq++) {
    expect(SquareSet.empty().toggle(sq)).toEqual(SquareSet.empty().with(sq));
    expect(SquareSet.fromSquare(sq).toggle(sq)).toEqual(SquareSet.empty());
    expect(SquareSet.full().toggle(sq)).toEqual(SquareSet.full().without(sq));
  }
});

test('shr96', () => {
  const r = new SquareSet(0xe0a1222, 0x1e222212, 0x0);
  expect(r.equals(r)).toBe(true);
  expect(r.shr96(1)).toEqual(new SquareSet(0x7050911, 0xf111109, 0x0));
  expect(r.shr96(3)).toEqual(new SquareSet(0x41c14244, 0x3c44442, 0x0));
  expect(r.shr96(31)).toEqual(new SquareSet(0x3c444424, 0x0, 0x0));
  expect(r.shr96(32)).toEqual(new SquareSet(0x1e222212, 0x0, 0x0));
  expect(r.shr96(33)).toEqual(new SquareSet(0xf111109, 0x0, 0x0));
  expect(r.shr96(62)).toEqual(new SquareSet(0x0, 0x0, 0x0));
});

// test('shl96', () => {
//   const r = new SquareSet(0xe0a1222, 0x1e222212);
//   expect(r.shl96(0)).toEqual(r);
//   expect(r.shl96(1)).toEqual(new SquareSet(0x1c142444, 0x3c444424));
//   expect(r.shl96(3)).toEqual(new SquareSet(0x70509110, 0xf1111090));
//   expect(r.shl96(31)).toEqual(new SquareSet(0x0, 0x7050911));
//   expect(r.shl96(32)).toEqual(new SquareSet(0x0, 0xe0a1222));
//   expect(r.shl96(33)).toEqual(new SquareSet(0x0, 0x1c142444));
//   expect(r.shl96(62)).toEqual(new SquareSet(0x0, 0x80000000));
//   expect(r.shl96(63)).toEqual(new SquareSet(0x0, 0x0));
// });

test('more than one', () => {
  expect(new SquareSet(0, 0, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(1, 0, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(2, 0, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(4, 0, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(-2147483648, 0, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(0, 1, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(0, 2, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(0, 4, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(0, -2147483648, 0).moreThanOne()).toBe(false);
  expect(new SquareSet(0, 0, 1).moreThanOne()).toBe(false);
  expect(new SquareSet(0, 0, 2).moreThanOne()).toBe(false);
  expect(new SquareSet(0, 0, 4).moreThanOne()).toBe(false);
  expect(new SquareSet(0, 0, 33554432).moreThanOne()).toBe(false);

  expect(new SquareSet(1, 1, 0).moreThanOne()).toBe(true);
  expect(new SquareSet(3, 0, 0).moreThanOne()).toBe(true);
  expect(new SquareSet(-1, 0, 0).moreThanOne()).toBe(true);
  expect(new SquareSet(0, 3, 0).moreThanOne()).toBe(true);
  expect(new SquareSet(0, -1, 0).moreThanOne()).toBe(true);
  expect(new SquareSet(0, 0, 3).moreThanOne()).toBe(true);
  expect(new SquareSet(0, 0, 67108863).moreThanOne()).toBe(true);
});
