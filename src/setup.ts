import { Board, boardEquals } from './board.js';
import { ByColor, ByRole, Color, Role, ROLES } from './types.js';

export class MaterialSide implements ByRole<number> {
  pawn: number;
  cannon: number;
  chariot: number;
  horse: number;
  elephant: number;
  advisor: number;
  king: number;

  private constructor() {}

  static empty(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = 0;
    return m;
  }

  static fromBoard(board: Board, color: Color): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = board.pieces(color, role).size();
    return m;
  }

  clone(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role];
    return m;
  }

  equals(other: MaterialSide): boolean {
    return ROLES.every(role => this[role] === other[role]);
  }

  add(other: MaterialSide): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role] + other[role];
    return m;
  }

  subtract(other: MaterialSide): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role] - other[role];
    return m;
  }

  nonEmpty(): boolean {
    return ROLES.some(role => this[role] > 0);
  }

  isEmpty(): boolean {
    return !this.nonEmpty();
  }

  hasPawns(): boolean {
    return this.pawn > 0;
  }

  hasNonPawns(): boolean {
    return this.cannon > 0 || this.chariot > 0 || this.horse > 0 || this.elephant > 0 || this.advisor > 0
      || this.king > 0;
  }

  size(): number {
    return this.pawn + this.cannon + this.chariot + this.horse + this.elephant + this.advisor + this.king;
  }
}

export class Material implements ByColor<MaterialSide> {
  constructor(
    public red: MaterialSide,
    public black: MaterialSide,
  ) {}

  static empty(): Material {
    return new Material(MaterialSide.empty(), MaterialSide.empty());
  }

  static fromBoard(board: Board): Material {
    return new Material(MaterialSide.fromBoard(board, 'red'), MaterialSide.fromBoard(board, 'black'));
  }

  clone(): Material {
    return new Material(this.red.clone(), this.black.clone());
  }

  equals(other: Material): boolean {
    return this.red.equals(other.red) && this.black.equals(other.black);
  }

  add(other: Material): Material {
    return new Material(this.red.add(other.red), this.black.add(other.black));
  }

  subtract(other: Material): Material {
    return new Material(this.red.subtract(other.red), this.black.subtract(other.black));
  }

  count(role: Role): number {
    return this.red[role] + this.black[role];
  }

  size(): number {
    return this.red.size() + this.black.size();
  }

  isEmpty(): boolean {
    return this.red.isEmpty() && this.black.isEmpty();
  }

  nonEmpty(): boolean {
    return !this.isEmpty();
  }

  hasPawns(): boolean {
    return this.red.hasPawns() || this.black.hasPawns();
  }

  hasNonPawns(): boolean {
    return this.red.hasNonPawns() || this.black.hasNonPawns();
  }
}

/**
 * A not necessarily legal xiangqi position.
 */
export interface Setup {
  board: Board;
  turn: Color;
  halfmoves: number;
  fullmoves: number;
}

export const defaultSetup = (): Setup => ({
  board: Board.default(),
  turn: 'red',
  halfmoves: 0,
  fullmoves: 1,
});

export const setupClone = (setup: Setup): Setup => ({
  board: setup.board.clone(),
  turn: setup.turn,
  halfmoves: setup.halfmoves,
  fullmoves: setup.fullmoves,
});

export const setupEquals = (left: Setup, right: Setup): boolean =>
  boardEquals(left.board, right.board)
  && left.turn === right.turn
  && left.halfmoves === right.halfmoves
  && left.fullmoves === right.fullmoves;
