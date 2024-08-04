import { expect, test } from '@jest/globals';
import { Board } from './board.js';
import { EMPTY_BOARD_FEN, INITIAL_BOARD_FEN, INITIAL_FEN, makeBoardFen, makeFen, parseFen } from './fen.js';
import { defaultSetup } from './setup.js';

test('make board fen', () => {
  expect(makeBoardFen(Board.default())).toEqual(INITIAL_BOARD_FEN);
  expect(makeBoardFen(Board.empty())).toEqual(EMPTY_BOARD_FEN);
});

test('make initial fen', () => {
  expect(makeFen(defaultSetup())).toEqual(INITIAL_FEN);
});

test('parse initial fen', () => {
  const setup = parseFen(INITIAL_FEN).unwrap();
  expect(setup.board).toEqual(Board.default());
  expect(setup.turn).toEqual('red');
  expect(setup.halfmoves).toEqual(0);
  expect(setup.fullmoves).toEqual(1);

  const setup_alt_notation = parseFen('rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR w - - 0 1').unwrap();
  expect(setup_alt_notation).toEqual(setup);
});

test('partial fen', () => {
  const setup = parseFen(INITIAL_BOARD_FEN).unwrap();
  expect(setup.board).toEqual(Board.default());
  expect(setup.turn).toEqual('red');
  expect(setup.halfmoves).toEqual(0);
  expect(setup.fullmoves).toEqual(1);
});

test('invalid fen', () => {
  expect(parseFen('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - w cq - 0P1').isErr).toBe(true);
  expect(parseFen('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w  - 0 1').isErr).toBe(true);
});

test.each([
  '9/9/9/9/9/9/9/9/9/9 w - - 12 42',
  '9/9/9/9/9/9/9/9/9/9 b - - 0 1',
])('parse and make fen', fen => {
  const setup = parseFen(fen).unwrap();
  expect(makeFen(setup)).toEqual(fen);
});
