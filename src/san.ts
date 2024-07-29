import { attacks, cannonAttacks } from './attacks.js';
import { SquareSet } from './squareSet.js';
import { FILE_NAMES, Move, RANK_NAMES, RankName, SquareName } from './types.js';
import { charToRole, defined, makeSquare, parseSquare, roleToChar, squareFile, squareRank } from './util.js';
import { Position } from './xiangqi.js';

const makeSanWithoutSuffix = (pos: Position, move: Move): string => {
  const piece = pos.board.get(move.from);
  if (!piece) return '--';

  let san = roleToChar(piece.role).toUpperCase();

  // Disambiguation
  // TODO: maybe this should be handled in attacksTo
  let others = pos.board.pieces(piece.color, piece.role).without(move.from);
  if (piece.role === 'cannon') {
    others = others.intersect(cannonAttacks(move.to, pos.board.occupied, true));
  } else {
    others = others.intersect(attacks(piece, move.to, pos.board.occupied));
  }

  if (others.nonEmpty()) {
    // there is no need for disambiguation if the other piece cannot move there.
    const ctx = pos.ctx();
    for (const from of others) {
      if (!pos.dests(from, ctx).has(move.to)) others = others.without(from);
    }
    if (others.nonEmpty()) {
      let row = false;
      let column = others.intersects(SquareSet.fromRank(squareRank(move.from)));
      if (others.intersects(SquareSet.fromFile(squareFile(move.from)))) row = true;
      else column = true;
      if (column) san += FILE_NAMES[squareFile(move.from)];
      if (row) san += RANK_NAMES[squareRank(move.from)];
    }
  }

  if (pos.board.occupied.has(move.to)) san += 'x';
  san += makeSquare(move.to);
  return san;
};

export const makeSanAndPlay = (pos: Position, move: Move): string => {
  const san = makeSanWithoutSuffix(pos, move);
  pos.play(move);
  if (pos.outcome()?.winner) return san + '#';
  if (pos.isCheck()) return san + '+';
  return san;
};

export const makeSanVariation = (pos: Position, variation: Move[]): string => {
  pos = pos.clone();
  const line = [];
  for (let i = 0; i < variation.length; i++) {
    if (i !== 0) line.push(' ');
    if (pos.turn === 'red') line.push(pos.fullmoves, '. ');
    else if (i === 0) line.push(pos.fullmoves, '... ');
    const san = makeSanWithoutSuffix(pos, variation[i]);
    pos.play(variation[i]);
    line.push(san);
    if (san === '--') return line.join('');
    if (i === variation.length - 1 && pos.outcome()?.winner) line.push('#');
    else if (pos.isCheck()) line.push('+');
  }
  return line.join('');
};

export const makeSan = (pos: Position, move: Move): string => makeSanAndPlay(pos.clone(), move);

export const parseSan = (pos: Position, san: string): Move | undefined => {
  const ctx = pos.ctx();

  const match = san.match(/^([NBRKACP])([a-i])?(10|[1-9])?[-x]?([a-i](?:10|[1-9]))[+#]?$/) as
    | [
      string,
      'N' | 'B' | 'R' | 'K' | 'A' | 'C' | 'P',
      string | undefined,
      string | undefined,
      SquareName,
    ]
    | null;
  if (!match) return;

  const role = charToRole(match[1]!);
  const to = parseSquare(match[4]);
  let candidates = pos.board.pieces(pos.turn, role);
  if (match[2] && match[3]) return; // no double disambiguation in xiangqi, too bad for xiangqi youtubers, if you know, you know
  if (match[2]) candidates = candidates.intersect(SquareSet.fromFile(match[2].charCodeAt(0) - 'a'.charCodeAt(0)));
  if (match[3]) candidates = candidates.intersect(SquareSet.fromRank(RANK_NAMES.indexOf(match[3] as RankName)));

  // Check uniqueness and legality
  let from;
  for (const candidate of candidates) {
    if (pos.dests(candidate, ctx).has(to)) {
      if (defined(from)) return; // Ambiguous
      from = candidate;
    }
  }
  if (!defined(from)) return; // Illegal

  return {
    from,
    to,
  };
};
