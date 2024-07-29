import { Result } from '@badrap/result';
import { Board } from './board.js';
import { Setup } from './setup.js';
import { Color, Piece } from './types.js';
import { charToRole, defined, roleToChar } from './util.js';

export const INITIAL_BOARD_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR';
export const INITIAL_EPD = INITIAL_BOARD_FEN + ' w - -';
export const INITIAL_FEN = INITIAL_EPD + ' 0 1';
export const EMPTY_BOARD_FEN = '9/9/9/9/9/9/9/9/9/9';
export const EMPTY_EPD = EMPTY_BOARD_FEN + ' w - -';
export const EMPTY_FEN = EMPTY_EPD + ' 0 1';

export enum InvalidFen {
  Fen = 'ERR_FEN',
  Board = 'ERR_BOARD',
  Turn = 'ERR_TURN',
  Halfmoves = 'ERR_HALFMOVES',
  Fullmoves = 'ERR_FULLMOVES',
}

export class FenError extends Error {}

const parseSmallUint = (str: string): number | undefined => (/^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined);

const charToPiece = (ch: string): Piece | undefined => {
  const role = charToRole(ch);
  return role && { role, color: ch.toLowerCase() === ch ? 'black' : 'red' };
};

export const parseBoardFen = (boardPart: string): Result<Board, FenError> => {
  const board = Board.empty();
  let rank = 9;
  let file = 0;
  for (let i = 0; i < boardPart.length; i++) {
    const c = boardPart[i];
    if (c === '/' && file === 9) {
      file = 0;
      rank--;
    } else {
      const step = parseInt(c, 10);
      if (step > 0) file += step;
      else {
        if (file >= 9 || rank < 0) return Result.err(new FenError(InvalidFen.Board));
        const square = file + rank * 9;
        const piece = charToPiece(c);
        if (!piece) return Result.err(new FenError(InvalidFen.Board));
        board.set(square, piece);
        file++;
      }
    }
  }

  if (rank !== 0 || file !== 9) return Result.err(new FenError(InvalidFen.Board));
  return Result.ok(board);
};

export const parseFen = (fen: string): Result<Setup, FenError> => {
  const parts = fen.split(/[\s_]+/);

  // Board
  const boardPart = parts.shift()!;
  const board: Result<Board, FenError> = parseBoardFen(boardPart);

  // Turn
  let turn: Color;
  const turnPart = parts.shift();
  if (!defined(turnPart) || turnPart === 'w') turn = 'red';
  else if (turnPart === 'b') turn = 'black';
  else return Result.err(new FenError(InvalidFen.Turn));

  const dummy1 = parts.shift();
  if (defined(dummy1) && dummy1 !== '-') return Result.err(new FenError(InvalidFen.Fen));

  const dummy2 = parts.shift();
  if (defined(dummy2) && dummy2 !== '-') return Result.err(new FenError(InvalidFen.Fen));

  return board.chain(board => {
    // Halfmoves
    const halfmovePart = parts.shift();
    const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
    if (!defined(halfmoves)) return Result.err(new FenError(InvalidFen.Halfmoves));

    // Fullmoves
    const fullmovesPart = parts.shift();
    const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
    if (!defined(fullmoves)) return Result.err(new FenError(InvalidFen.Fullmoves));

    if (parts.length > 0) return Result.err(new FenError(InvalidFen.Fen));

    return Result.ok({
      board,
      turn,
      halfmoves,
      fullmoves: Math.max(1, fullmoves),
    });
  });
};

export interface FenOpts {
  epd?: boolean;
}

export const parsePiece = (str: string): Piece | undefined => {
  if (!str) return;
  const piece = charToPiece(str[0]);
  if (!piece) return;
  else if (str.length > 1) return;
  return piece;
};

export const makePiece = (piece: Piece): string => {
  let r = roleToChar(piece.role);
  if (piece.color === 'red') r = r.toUpperCase();
  return r;
};

export const makeBoardFen = (board: Board): string => {
  let fen = '';
  let empty = 0;
  for (let rank = 9; rank >= 0; rank--) {
    for (let file = 0; file < 9; file++) {
      const square = file + rank * 9;
      const piece = board.get(square);
      if (!piece) empty++;
      else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += makePiece(piece);
      }

      if (file === 8) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        if (rank !== 0) fen += '/';
      }
    }
  }
  return fen;
};

export const makeFen = (setup: Setup, opts?: FenOpts): string =>
  [
    makeBoardFen(setup.board),
    setup.turn === 'red' ? 'w' : 'b',
    '- -',
    ...(opts?.epd ? [] : [Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]),
  ].join(' ');
