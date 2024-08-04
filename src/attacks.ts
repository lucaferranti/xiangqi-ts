/**
 * Compute attacks and rays.
 *
 * These are low-level functions that can be used to implement xiangqi rules.
 *
 * @packageDocumentation
 */

import { SquareSet } from './squareSet.js';
import { BySquare, Color, Piece, Square } from './types.js';
import { squareFile, squareRank } from './util.js';

const tabulate = <T>(f: (square: Square) => T): BySquare<T> => {
  const table = [];
  for (let square = 0; square < 90; square++) table[square] = f(square);
  return table;
};

/**
 * Check that the move from `origin` to `dest` is valid for a stepping piece.
 * The last part of the check is to ensure a piece does not wrap around the other side of the board.
 */
export const isValidStep = (origin: Square, dest: Square): boolean => {
  return 0 <= dest
    && dest < 90
    && Math.abs(squareFile(origin) - squareFile(dest)) <= 2;
};

const FILE_RANGE = tabulate((sq) => SquareSet.fromFile(squareFile(sq)).without(sq));
const RANK_RANGE = tabulate((sq) => SquareSet.fromRank(squareRank(sq)).without(sq));

const KING_DIRS = [-9, 9, -1, 1];
export const KING_SQUARES = {
  red: [3, 4, 5, 12, 13, 14, 21, 22, 23],
  black: [66, 67, 68, 75, 76, 77, 84, 85, 86],
};

const ADVISOR_DIRS = [-10, -8, 8, 10];
export const ADVISOR_SQUARES = {
  red: [3, 5, 13, 21, 23],
  black: [66, 68, 76, 84, 86],
};

const ELEPHANT_DIR_BLOCKERS = [[-20, -10], [-16, -8], [16, 8], [20, 10]];
export const ELEPHANT_SQUARES = {
  red: [18, 2, 38, 22, 42, 6, 26],
  black: [63, 83, 47, 67, 87, 51, 71],
};

const HORSE_DIR_BLOCKERS = [[-19, -9], [-17, -9], [-11, -1], [7, -1], [-7, 1], [11, 1], [17, 9], [19, 9]];

const PAWN_DIRS = {
  red: (sq: Square) => sq >= 45 ? [-1, 9, 1] : [9],
  black: (sq: Square) => sq < 45 ? [-1, -9, 1] : [-9],
};

const CANNON_CHARIOT_DIRS = [-9, 9, -1, 1];

/**
 * Gets squares attacked or defended by a king of side `color` on `square`.
 */
export const kingAttacks = (color: Color, square: Square): SquareSet => {
  let range = SquareSet.empty();
  for (const dir of KING_DIRS) {
    const dest = square + dir;
    if (KING_SQUARES[color].includes(dest)) range = range.with(dest);
  }
  return range;
};

/**
 * Gets squares attacked or defended by an advisor of side `color` on `square`.
 */
export const advisorAttacks = (color: Color, square: Square): SquareSet => {
  let range = SquareSet.empty();
  for (const dir of ADVISOR_DIRS) {
    const dest = square + dir;
    if (ADVISOR_SQUARES[color].includes(dest)) range = range.with(dest);
  }
  return range;
};

/**
 * Gets squares attacked or defended by an elephant of side `color` on `square`, given `occupied` squares.
 */
export const elephantAttacks = (color: Color, square: Square, occupied: SquareSet): SquareSet => {
  let range = SquareSet.empty();
  for (const dir_blocker of ELEPHANT_DIR_BLOCKERS) {
    if (!occupied.has(square + dir_blocker[1])) {
      const dest = square + dir_blocker[0];
      if (ELEPHANT_SQUARES[color].includes(dest)) range = range.with(dest);
    }
  }
  return range;
};

/**
 * Gets squares attacked or defended by a horse on `square` given `occupied`.
 */
export const horseAttacks = (square: Square, occupied: SquareSet): SquareSet => {
  let range = SquareSet.empty();
  for (const dir_blocker of HORSE_DIR_BLOCKERS) {
    if (!occupied.has(square + dir_blocker[1])) {
      const dest = square + dir_blocker[0];
      if (isValidStep(square, dest)) range = range.with(dest);
    }
  }
  return range;
};

/**
 * Gets squares attacked or defended by a pawn of the given `color`
 * on `square`.
 */
export const pawnAttacks = (color: Color, square: Square): SquareSet => {
  let range = SquareSet.empty();
  const dirs = PAWN_DIRS[color](square);
  for (const dir of dirs) {
    const dest = square + dir;
    if (isValidStep(square, dest)) range = range.with(dest);
  }
  return range;
};

/**
 * Gets squares attacked or defended by a chariot on `square`, given `occupied`
 * squares.
 */
// TODO: try rewriting this with hyperbola quintessence
export const chariotAttacks = (square: Square, occupied: SquareSet): SquareSet => {
  let range = SquareSet.empty();
  const minRank = squareRank(square) * 9;
  const maxRank = minRank + 9;
  for (const dir of CANNON_CHARIOT_DIRS) {
    const minRange = dir === -1 || dir === 1 ? minRank : 0;
    const maxRange = dir === -1 || dir === 1 ? maxRank : 90;
    let cand = square + dir;
    while (minRange <= cand && cand < maxRange) {
      range = range.with(cand);
      if (occupied.has(cand)) break;
      cand += dir;
    }
  }
  return range;
};

/**
 * Gets squares attacked or defended by a cannon on `square`, given `occupied`.
 * If `keepMount` is set to `true`, then also the potential mount (first piece encountered in a ray)
 * is included in the returned biboard. This is useful to parse SAN moves.
 * squares.
 */
// TODO: try rewriting this with hyperbola quintessence
export const cannonAttacks = (square: Square, occupied: SquareSet, keepMount?: boolean): SquareSet => {
  let range = SquareSet.empty();
  const minRank = squareRank(square) * 9;
  const maxRank = minRank + 9;
  for (const dir of CANNON_CHARIOT_DIRS) {
    const minRange = dir === -1 || dir === 1 ? minRank : 0;
    const maxRange = dir === -1 || dir === 1 ? maxRank : 90;
    let cand = square + dir;
    let found_mount = false;
    while (minRange <= cand && cand < maxRange) {
      if (found_mount) {
        if (occupied.has(cand)) {
          range = range.with(cand);
          break;
        }
      } else {
        if (occupied.has(cand)) {
          found_mount = true;
          if (keepMount) range = range.with(cand);
        } else range = range.with(cand);
      }
      cand += dir;
    }
  }
  return range;
};

/**
 * Gets squares seen by a `piece` on `square`, given `occupied` squares.
 */
export const attacks = (
  piece: Piece,
  square: Square,
  occupied: SquareSet,
): SquareSet => {
  switch (piece.role) {
    case 'pawn':
      return pawnAttacks(piece.color, square);
    case 'cannon':
      return cannonAttacks(square, occupied);
    case 'chariot':
      return chariotAttacks(square, occupied);
    case 'horse':
      return horseAttacks(square, occupied);
    case 'elephant':
      return elephantAttacks(piece.color, square, occupied);
    case 'advisor':
      return advisorAttacks(piece.color, square);
    case 'king':
      return kingAttacks(piece.color, square);
  }
};

/**
 * Gets all squares of the rank, file or diagonal with the two squares
 * `a` and `b`, or an empty set if they are not aligned.
 */
export const ray = (a: Square, b: Square): SquareSet => {
  const other = SquareSet.fromSquare(b);
  if (RANK_RANGE[a].intersects(other)) return RANK_RANGE[a].with(a);
  if (FILE_RANGE[a].intersects(other)) return FILE_RANGE[a].with(a);
  return SquareSet.empty();
};

/**
 * Gets all squares between `a` and `b` (bounds not included), or an empty set
 * if they are not on the same rank or file.
 */
export const between = (a: Square, b: Square): SquareSet =>
  ray(a, b)
    .intersect(SquareSet.full().shl96(a).xor(SquareSet.full().shl96(b)))
    .withoutFirst();
