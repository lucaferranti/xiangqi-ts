import { SquareSet } from './squareSet.js';
import { ByColor, ByRole, Color, COLORS, Piece, Role, ROLES, Square } from './types.js';

/**
 * Piece positions on a board.
 *
 * Properties are sets of squares, like `board.occupied` for all occupied
 * squares, `board[color]` for all pieces of that color, and `board[role]`
 * for all pieces of that role. When modifying the properties directly, take
 * care to keep them consistent.
 */
export class Board implements Iterable<[Square, Piece]>, ByRole<SquareSet>, ByColor<SquareSet> {
  /**
   * All occupied squares.
   */
  occupied: SquareSet;

  red: SquareSet;
  black: SquareSet;

  pawn: SquareSet;
  cannon: SquareSet;
  chariot: SquareSet;
  horse: SquareSet;
  elephant: SquareSet;
  advisor: SquareSet;
  king: SquareSet;

  private constructor() {}

  static default(): Board {
    const board = new Board();
    board.reset();
    return board;
  }

  /**
   * Resets all pieces to the default starting position for standard xiangqi.
   */
  reset(): void {
    this.occupied = new SquareSet(0xaa08_01ff, 0x5540_000a, 0x03fe_0041);
    this.red = new SquareSet(0xaa0801ff, 0xa, 0x0);
    this.black = new SquareSet(0x0, 0x5540_0000, 0x03fe_0041);
    this.pawn = new SquareSet(0xa800_0000, 0x5540_000a, 0x0);
    this.cannon = new SquareSet(0x0208_0000, 0x0, 0x41);
    this.chariot = new SquareSet(0x0101, 0x0, 0x0202_0000);
    this.horse = new SquareSet(0x0082, 0x0, 0x0104_0000);
    this.elephant = new SquareSet(0x0044, 0x0, 0x0088_0000);
    this.advisor = new SquareSet(0x0028, 0x0, 0x0050_0000);
    this.king = new SquareSet(0x10, 0x0, 0x0020_0000);
  }

  static empty(): Board {
    const board = new Board();
    board.clear();
    return board;
  }

  clear(): void {
    this.occupied = SquareSet.empty();
    for (const color of COLORS) this[color] = SquareSet.empty();
    for (const role of ROLES) this[role] = SquareSet.empty();
  }

  clone(): Board {
    const board = new Board();
    board.occupied = this.occupied;
    for (const color of COLORS) board[color] = this[color];
    for (const role of ROLES) board[role] = this[role];
    return board;
  }

  getColor(square: Square): Color | undefined {
    if (this.red.has(square)) return 'red';
    if (this.black.has(square)) return 'black';
    return;
  }

  getRole(square: Square): Role | undefined {
    for (const role of ROLES) {
      if (this[role].has(square)) return role;
    }
    return;
  }

  get(square: Square): Piece | undefined {
    const color = this.getColor(square);
    if (!color) return;
    const role = this.getRole(square)!;
    return { color, role };
  }

  /**
   * Removes and returns the piece from the given `square`, if any.
   */
  take(square: Square): Piece | undefined {
    const piece = this.get(square);
    if (piece) {
      this.occupied = this.occupied.without(square);
      this[piece.color] = this[piece.color].without(square);
      this[piece.role] = this[piece.role].without(square);
    }
    return piece;
  }

  /**
   * Put `piece` onto `square`, potentially replacing an existing piece.
   * Returns the existing piece, if any.
   */
  set(square: Square, piece: Piece): Piece | undefined {
    const old = this.take(square);
    this.occupied = this.occupied.with(square);
    this[piece.color] = this[piece.color].with(square);
    this[piece.role] = this[piece.role].with(square);
    return old;
  }

  has(square: Square): boolean {
    return this.occupied.has(square);
  }

  *[Symbol.iterator](): Iterator<[Square, Piece]> {
    for (const square of this.occupied) {
      yield [square, this.get(square)!];
    }
  }

  pieces(color: Color, role: Role): SquareSet {
    return this[color].intersect(this[role]);
  }

  /**
   * Finds the unique king of the given `color`, if any.
   */
  kingOf(color: Color): Square | undefined {
    return this.pieces(color, 'king').singleSquare();
  }
}

export const boardEquals = (left: Board, right: Board): boolean =>
  left.red.equals(right.red)
  && left.black.equals(right.black)
  && ROLES.every(role => left[role].equals(right[role]));
