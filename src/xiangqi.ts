import { Result } from '@badrap/result';
import {
  ADVISOR_SQUARES,
  advisorAttacks,
  attacks,
  between,
  cannonAttacks,
  chariotAttacks,
  ELEPHANT_SQUARES,
  elephantAttacks,
  horseAttacks,
  KING_SQUARES,
  kingAttacks,
  pawnAttacks,
  isValidStep
} from './attacks.js';
import { Board, boardEquals } from './board.js';
import { Setup } from './setup.js';
import { SquareSet } from './squareSet.js';
import { Color, COLORS, Move, Outcome, Piece, Role, ROLES, Rules, Square } from './types.js';
import { defined, opposite, squareFile } from './util.js';

export enum IllegalSetup {
  Empty = 'ERR_EMPTY',
  OppositeCheck = 'ERR_OPPOSITE_CHECK',
  Kings = 'ERR_KINGS',
  Advisors = 'ERR_ADVISORS',
  Elephants = 'ERR_ELEPHANTS',
  Horses = 'ERR_HORSES',
  Chariots = 'ERR_CHARIOTS',
  Cannons = 'ERR_CANNONS',
  Pawns = 'ERR_PAWNS',
  FacingKings = 'ERR_FACING_KINGS',
}

export class PositionError extends Error {}

const PIECE_SPECS = {
  'king': {
    'maxNum': 1,
    'forbidden_squares': {
      red: SquareSet.fromSquares(...KING_SQUARES.red).complement(),
      black: SquareSet.fromSquares(...KING_SQUARES.black).complement(),
    },
    'err': IllegalSetup.Kings,
  },
  'advisor': {
    'maxNum': 2,
    'forbidden_squares': {
      red: SquareSet.fromSquares(...ADVISOR_SQUARES.red).complement(),
      black: SquareSet.fromSquares(...ADVISOR_SQUARES.black).complement(),
    },
    'err': IllegalSetup.Advisors,
  },
  'elephant': {
    'maxNum': 2,
    'forbidden_squares': {
      red: SquareSet.fromSquares(...ELEPHANT_SQUARES.red).complement(),
      black: SquareSet.fromSquares(...ELEPHANT_SQUARES.black).complement(),
    },
    'err': IllegalSetup.Elephants,
  },
  'horse': {
    'maxNum': 2,
    'forbidden_squares': {
      'red': SquareSet.empty(),
      'black': SquareSet.empty(),
    },
    'err': IllegalSetup.Horses,
  },
  'chariot': {
    'maxNum': 2,
    'forbidden_squares': {
      'red': SquareSet.empty(),
      'black': SquareSet.empty(),
    },
    'err': IllegalSetup.Chariots,
  },
  'cannon': {
    'maxNum': 2,
    'forbidden_squares': {
      'red': SquareSet.empty(),
      'black': SquareSet.empty(),
    },
    'err': IllegalSetup.Cannons,
  },
  'pawn': {
    'maxNum': 5,
    'forbidden_squares': {
      red: new SquareSet(0xa800_0000, 0xffff_f55a, 0x03ff_ffff).complement(),
      black: new SquareSet(0xffff_ffff, 0x556a_bfff, 0x0).complement(),
    },
    'err': IllegalSetup.Pawns,
  },
};

const HORSE_DIR_INV_BLOCKERS = [[-19, -10], [-17, -8], [-11, -10], [7, 8], [-7, -8], [11, 10], [17, 8], [19, 10]];
export const horseInvAttacks = (square: Square, occupied: SquareSet): SquareSet => {
  let range = SquareSet.empty();
  for (const dir_blocker of HORSE_DIR_INV_BLOCKERS) {
    if (!occupied.has(square + dir_blocker[1])) {
      const dest = square + dir_blocker[0];
      if (isValidStep(square, dest)) range = range.with(dest);
    }
  }
  return range;
};

// return bitboard with all pieces of `attacker` color attacking the square `square`.
const attacksTo = (square: Square, attacker: Color, board: Board, occupied: SquareSet): SquareSet =>
  board[attacker].intersect(
    chariotAttacks(square, occupied).intersect(board.chariot)
      .union(horseInvAttacks(square, occupied).intersect(board.horse))
      .union(elephantAttacks(attacker, square, occupied).intersect(board.elephant))
      .union(advisorAttacks(attacker, square).intersect(board.advisor))
      .union(kingAttacks(attacker, square).intersect(board.king))
      .union(cannonAttacks(square, occupied).intersect(board.cannon))
      .union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)),
  );

export interface Context {
  king: Square | undefined;
  checkers: SquareSet;
}

export const defaultPosition = (rules: Rules): Position => {
  switch (rules) {
    case 'xiangqi':
      return Xiangqi.default();
  }
};

export abstract class Position {
  board: Board;
  turn: Color;
  halfmoves: number;
  fullmoves: number;

  protected constructor(readonly rules: Rules) {}

  reset() {
    this.board = Board.default();
    this.turn = 'red';
    this.halfmoves = 0;
    this.fullmoves = 1;
  }

  protected setupUnchecked(setup: Setup) {
    this.board = setup.board.clone();
    this.turn = setup.turn;
    this.halfmoves = setup.halfmoves;
    this.fullmoves = setup.fullmoves;
  }

  // When subclassing overwrite at least:
  //
  // - static default()
  // - static fromSetup()
  // - static clone()
  //
  // - dests()
  // - hasInsufficientMaterial()
  // - isStandardMaterial()

  attackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this.board, occupied);
  }

  ctx(): Context {
    const king = this.board.kingOf(this.turn);
    if (!defined(king)) {
      return { king, checkers: SquareSet.empty() };
    }

    const checkers = this.attackers(king, opposite(this.turn), this.board.occupied);
    return {
      king,
      checkers,
    };
  }

  clone(): Position {
    const pos = new (this as any).constructor();
    pos.board = this.board.clone();
    pos.turn = this.turn;
    pos.halfmoves = this.halfmoves;
    pos.fullmoves = this.fullmoves;
    return pos;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));

    const ourKing = this.board.kingOf(this.turn);
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(ourKing) || !defined(otherKing)) return Result.err(new PositionError(IllegalSetup.Kings));

    if (squareFile(ourKing) === squareFile(otherKing) && between(ourKing, otherKing).isDisjoint(this.board.occupied)) {
      return Result.err(new PositionError(IllegalSetup.FacingKings));
    }

    if (this.attackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }

    for (const c of COLORS) {
      for (const r of ROLES) {
        const p = this.board.pieces(c, r);
        if (p.size() > PIECE_SPECS[r].maxNum || p.intersects(PIECE_SPECS[r].forbidden_squares[c])) {
          return Result.err(new PositionError(PIECE_SPECS[r].err));
        }
      }
    }

    return Result.ok(undefined);
  }

  pseudoDests(piece: Piece, square: Square): SquareSet {
    const pseudo = attacks(piece, square, this.board.occupied);
    return pseudo.diff(this.board[this.turn]); // don't capture friendly pieces
  }

  // generate all legal  for a piece on given square
  dests(square: Square, ctx?: Context): SquareSet {
    const piece = this.board.get(square);
    if (!piece || piece.color !== this.turn) return SquareSet.empty();

    let pseudo = this.pseudoDests(piece, square);

    // shortcut to not deal with pins and double-triple checks. Try to make the move and if after that
    // the king is in check or facing the other king, discard it.
    for (const to of pseudo) {
      const newPos = this.clone();
      newPos.board.take(square);
      newPos.board.set(to, piece);
      if (newPos.isCheck() || newPos.isFacingKings()) pseudo = pseudo.without(to);
    }

    return pseudo;
  }

  // The following should be identical in all subclasses

  toSetup(): Setup {
    return {
      board: this.board.clone(),
      turn: this.turn,
      halfmoves: Math.min(this.halfmoves, 150),
      fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999),
    };
  }

  hasInsufficientMaterial(c: Color): boolean {
    if (this.board.pieces(c, 'chariot').union(this.board.pieces(c, 'horse')).nonEmpty()) return false;
    if (this.board.pieces(c, 'cannon').nonEmpty()) {
      // cannon with elephants only is insufficient material
      return this.board.advisor.isEmpty() && this.board.pawn.isEmpty();
    }
    // no pawns or only pawns on the backrank
    return this.board.pieces(c, 'pawn').diff(SquareSet.backrank(c)).isEmpty();
  }

  isInsufficientMaterial(): boolean {
    return COLORS.every(color => this.hasInsufficientMaterial(color));
  }

  hasDests(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    for (const square of this.board[this.turn]) {
      if (this.dests(square, ctx).nonEmpty()) return true;
    }
    return false;
  }

  /* Check if a move is legal */
  isLegal(move: Move, ctx?: Context): boolean {
    const dests = this.dests(move.from, ctx);
    return dests.has(move.to);
  }

  isFacingKings(): boolean {
    const ourKing = this.board.king.first()!;
    const otherKing = this.board.king.last()!;
    return (squareFile(ourKing) === squareFile(otherKing)
      && between(ourKing, otherKing).isDisjoint(this.board.occupied));
  }

  isCheck(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return ctx.checkers.nonEmpty();
  }

  is50Moves(): boolean {
    return this.halfmoves >= 50;
  }

  isEnd(ctx?: Context): boolean {
    return this.isInsufficientMaterial() || this.is50Moves() || !this.hasDests(ctx);
  }

  isCheckmate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return ctx.checkers.nonEmpty() && !this.hasDests(ctx);
  }

  isStalemate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return ctx.checkers.isEmpty() && !this.hasDests(ctx);
  }

  outcome(ctx?: Context): Outcome | undefined {
    ctx = ctx || this.ctx();
    if (this.isCheckmate(ctx) || this.isStalemate(ctx)) return { winner: opposite(this.turn) };
    else if (this.isInsufficientMaterial() || this.is50Moves()) return { winner: undefined };
    else return;
  }

  allDests(ctx?: Context): Map<Square, SquareSet> {
    ctx = ctx || this.ctx();
    const d = new Map();
    for (const square of this.board[this.turn]) {
      d.set(square, this.dests(square, ctx));
    }
    return d;
  }

  play(move: Move): void {
    const turn = this.turn;

    this.halfmoves += 1;
    if (turn === 'black') this.fullmoves += 1;
    this.turn = opposite(turn);

    const piece = this.board.take(move.from);
    if (!piece) return;

    const capture = this.board.set(move.to, piece);
    if (capture) this.halfmoves = 0;
  }
}

export class Xiangqi extends Position {
  private constructor() {
    super('xiangqi');
  }

  static default(): Xiangqi {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup): Result<Xiangqi, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map(_ => pos);
  }

  clone(): Xiangqi {
    return super.clone() as Xiangqi;
  }
}

export const equalsIgnoreMoves = (left: Position, right: Position): boolean =>
  boardEquals(left.board, right.board) && left.turn === right.turn;

export const isStandardMaterialSide = (board: Board, color: Color): boolean => {
  for (const piece in ROLES) {
    if (piece === 'pawn' && board.pieces(color, piece as Role).size() > 5) return false;
    if (piece === 'king' && board.pieces(color, piece as Role).size() !== 1) return false;
    if (board.pieces(color, piece as Role).size() > 2) return false;
  }
  return true;
};

export const isStandardMaterial = (pos: Xiangqi): boolean =>
  COLORS.every(color => isStandardMaterialSide(pos.board, color));

export const isImpossibleCheck = (pos: Position): boolean => {
  const ourKing = pos.board.kingOf(pos.turn);
  if (!defined(ourKing)) return false;
  const checkers = pos.attackers(ourKing, opposite(pos.turn), pos.board.occupied);
  if (checkers.isEmpty()) return false;

  // Xiangqi can have up to quadruple check
  return checkers.size() > 4;
};
