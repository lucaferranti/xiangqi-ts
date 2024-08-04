/**
 * Compatibility with other libraries.
 *
 * Convert between the formats used by xiangqi. This will allow for compatibility with
 * [xiangqiground](https://github.com/lucaferranti/xiangqiground).
 *
 * @packageDocumentation
 */

import { Move, SquareName } from './types.js';
import { makeSquare } from './util.js';
import { Position } from './xiangqi.js';

/**
 * Computes the legal move destinations in the format used by xiangqiground.
 */
export const xiangqigroundDests = (pos: Position): Map<SquareName, SquareName[]> => {
  const result = new Map();
  const ctx = pos.ctx();
  for (const [from, squares] of pos.allDests(ctx)) {
    if (squares.nonEmpty()) {
      const d = Array.from(squares, makeSquare);
      result.set(makeSquare(from), d);
    }
  }
  return result;
};

export const xiangqigroundMove = (move: Move): SquareName[] => [makeSquare(move.from), makeSquare(move.to)];
