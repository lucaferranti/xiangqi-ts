import { Color, FILE_NAMES, FileName, Move, RANK_NAMES, RankName, Role, Square, SquareName } from './types.js';

export const defined = <A>(v: A | undefined): v is A => v !== undefined;

export const opposite = (color: Color): Color => (color === 'red' ? 'black' : 'red');

export const squareRank = (square: Square): number => Math.floor(square / 9);

export const squareFile = (square: Square): number => square % 9;

export const squareFromCoords = (file: number, rank: number): Square | undefined =>
  0 <= file && file < 9 && 0 <= rank && rank < 10 ? file + 9 * rank : undefined;

export const roleToChar = (role: Role): string => {
  switch (role) {
    case 'pawn':
      return 'p';
    case 'cannon':
      return 'c';
    case 'chariot':
      return 'r';
    case 'horse':
      return 'n';
    case 'elephant':
      return 'b';
    case 'advisor':
      return 'a';
    case 'king':
      return 'k';
  }
};

export function charToRole(ch: 'p' | 'c' | 'r' | 'n' | 'b' | 'a' | 'k' | 'P' | 'C' | 'R' | 'N' | 'B' | 'A' | 'K'): Role;
export function charToRole(ch: string): Role | undefined;
export function charToRole(ch: string): Role | undefined {
  switch (ch.toLowerCase()) {
    case 'p':
      return 'pawn';
    case 'c':
      return 'cannon';
    case 'r':
      return 'chariot';
    case 'n':
      return 'horse';
    case 'b':
      return 'elephant';
    case 'a':
      return 'advisor';
    case 'k':
      return 'king';
    default:
      return;
  }
}

export function parseSquare(str: SquareName): Square;
export function parseSquare(str: string): Square | undefined;
export function parseSquare(str: string): Square | undefined {
  return squareFromCoords(FILE_NAMES.indexOf(str[0] as FileName), RANK_NAMES.indexOf(str.slice(1) as RankName));
}

export const makeSquare = (square: Square): SquareName =>
  (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]) as SquareName;

export const parseUci = (str: string): Move | undefined => {
  const regex = /^([a-i](?:[1-9]|10))([a-i](?:[1-9]|10))$/;
  const match = str.match(regex);
  if (match) {
    const from = parseSquare(match[1]);
    const to = parseSquare(match[2]);
    if (defined(from) && defined(to)) return { from, to };
  }
  return;
};

export const moveEquals = (left: Move, right: Move): boolean => {
  return (left.to === right.to) && (left.from === right.from);
};

/**
 * Converts a move to UCI notation, like `g1f3`,
 */
export const makeUci = (move: Move): string => makeSquare(move.from) + makeSquare(move.to);
