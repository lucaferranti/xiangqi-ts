import { expect, test } from '@jest/globals';
import { Board, boardEquals } from './board.js';
import { Piece } from './types.js';

test('set and get', () => {
  const emptyBoard = Board.empty();
  expect(emptyBoard.getColor(0)).toBeUndefined();
  expect(emptyBoard.getRole(0)).toBeUndefined();
  expect(emptyBoard.has(0)).toBe(false);
  expect(emptyBoard.get(0)).toBeUndefined();
  expect(boardEquals(emptyBoard, emptyBoard.clone())).toBe(true);

  const board = emptyBoard.clone();
  const piece: Piece = { role: 'horse', color: 'black' };
  expect(board.set(0, piece)).toBeUndefined();
  expect(board.getColor(0)).toBe('black');
  expect(board.getRole(0)).toBe('horse');
  expect(board.has(0)).toBe(true);
  expect(board.get(0)).toEqual(piece);
  expect(boardEquals(board, board.clone())).toBe(true);
  expect(boardEquals(emptyBoard, board)).toBe(false);

  const default_board = Board.default();
  // chariots
  expect(default_board.get(0)).toEqual({ role: 'chariot', color: 'red' });
  expect(default_board.get(8)).toEqual({ role: 'chariot', color: 'red' });
  expect(default_board.get(81)).toEqual({ role: 'chariot', color: 'black' });
  expect(default_board.get(89)).toEqual({ role: 'chariot', color: 'black' });

  // horses
  expect(default_board.get(1)).toEqual({ role: 'horse', color: 'red' });
  expect(default_board.get(7)).toEqual({ role: 'horse', color: 'red' });
  expect(default_board.get(82)).toEqual({ role: 'horse', color: 'black' });
  expect(default_board.get(88)).toEqual({ role: 'horse', color: 'black' });

  // elephants
  expect(default_board.get(2)).toEqual({ role: 'elephant', color: 'red' });
  expect(default_board.get(6)).toEqual({ role: 'elephant', color: 'red' });
  expect(default_board.get(83)).toEqual({ role: 'elephant', color: 'black' });
  expect(default_board.get(87)).toEqual({ role: 'elephant', color: 'black' });

  // advisors
  expect(default_board.get(3)).toEqual({ role: 'advisor', color: 'red' });
  expect(default_board.get(5)).toEqual({ role: 'advisor', color: 'red' });
  expect(default_board.get(84)).toEqual({ role: 'advisor', color: 'black' });
  expect(default_board.get(86)).toEqual({ role: 'advisor', color: 'black' });

  // kings
  expect(default_board.get(4)).toEqual({ role: 'king', color: 'red' });
  expect(default_board.get(85)).toEqual({ role: 'king', color: 'black' });

  // cannons
  expect(default_board.get(19)).toEqual({ role: 'cannon', color: 'red' });
  expect(default_board.get(25)).toEqual({ role: 'cannon', color: 'red' });
  expect(default_board.get(64)).toEqual({ role: 'cannon', color: 'black' });
  expect(default_board.get(70)).toEqual({ role: 'cannon', color: 'black' });

  // pawns
  // for (const idx of [27, 29, 31, 33, 35]) expect(default_board.get(idx)).toEqual({role: 'pawn', color: 'red'})

  [27, 29, 31, 33, 35].forEach(idx => expect(default_board.get(idx)).toEqual({ role: 'pawn', color: 'red' }));
  [54, 56, 58, 60, 62].forEach(idx => expect(default_board.get(idx)).toEqual({ role: 'pawn', color: 'black' }));
});
