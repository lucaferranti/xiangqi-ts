import { Color, Square } from './types.js';

const popcnt32 = (n: number): number => {
  n = n - ((n >>> 1) & 0x5555_5555);
  n = (n & 0x3333_3333) + ((n >>> 2) & 0x3333_3333);
  return Math.imul((n + (n >>> 4)) & 0x0f0f_0f0f, 0x0101_0101) >> 24;
};

// const bswap32 = (n: number): number => {
//   n = ((n >>> 8) & 0x00ff_00ff) | ((n & 0x00ff_00ff) << 8);
//   return ((n >>> 16) & 0xffff) | ((n & 0xffff) << 16);
// };

// const rbit32 = (n: number): number => {
//   n = ((n >>> 1) & 0x5555_5555) | ((n & 0x5555_5555) << 1);
//   n = ((n >>> 2) & 0x3333_3333) | ((n & 0x3333_3333) << 2);
//   n = ((n >>> 4) & 0x0f0f_0f0f) | ((n & 0x0f0f_0f0f) << 4);
//   return bswap32(n);
// };

/**
 * An immutable set of squares, implemented as a bitboard. A xiangqi board is 9x10, hence we
 * need 90 bits. We use 3 32-bits integers.
 */
export class SquareSet implements Iterable<Square> {
  readonly lo: number;
  readonly mid: number;
  readonly hi: number;

  constructor(lo: number, mid: number, hi: number) {
    this.lo = lo | 0;
    this.mid = mid | 0;
    this.hi = hi & 0x03ff_ffff;
  }

  static fromSquare(square: Square): SquareSet {
    return square >= 64
      ? new SquareSet(0, 0, 1 << (square - 64))
      : square >= 32
      ? new SquareSet(0, 1 << (square - 32), 0)
      : new SquareSet(1 << square, 0, 0);
  }

  static fromSquares(...squares: Square[]): SquareSet {
    let set = SquareSet.empty();
    for (const square of squares) set = set.with(square);
    return set;
  }

  static fromRank(rank: number): SquareSet {
    return new SquareSet(0x1ff, 0, 0).shl96(9 * rank);
  }

  static fromFile(file: number): SquareSet {
    return new SquareSet(0x08040201, 0x80402010, 0x00020100).shl96(file);
    // const mask1 = 0x08040201
    // const mask2 = file >= 5 ? 0x80402011 : 0x80402010
    // const mask3 = file >= 1 ? 0x00020101 : 0x00020100
    // return new SquareSet(mask1 << file, mask2 << file, mask3 << file);
  }

  static empty(): SquareSet {
    return new SquareSet(0x0, 0x0, 0x0);
  }

  static full(): SquareSet {
    return new SquareSet(0xffff_ffff, 0xffff_ffff, 0x03ff_ffff);
  }

  static backranks(): SquareSet {
    return new SquareSet(0x1ff, 0, 0x03fe_0000);
  }

  static backrank(color: Color): SquareSet {
    return color === 'red' ? new SquareSet(0, 0, 0x03fe_0000) : new SquareSet(0x1ff, 0, 0);
  }

  complement(): SquareSet {
    return new SquareSet(~this.lo, ~this.mid, ~this.hi);
  }

  xor(other: SquareSet): SquareSet {
    return new SquareSet(this.lo ^ other.lo, this.mid ^ other.mid, this.hi ^ other.hi);
  }

  union(other: SquareSet): SquareSet {
    return new SquareSet(this.lo | other.lo, this.mid | other.mid, this.hi | other.hi);
  }

  intersect(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & other.lo, this.mid & other.mid, this.hi & other.hi);
  }

  diff(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & ~other.lo, this.mid & ~other.mid, this.hi & ~other.hi);
  }

  intersects(other: SquareSet): boolean {
    return this.intersect(other).nonEmpty();
  }

  isDisjoint(other: SquareSet): boolean {
    return this.intersect(other).isEmpty();
  }

  supersetOf(other: SquareSet): boolean {
    return other.diff(this).isEmpty();
  }

  subsetOf(other: SquareSet): boolean {
    return this.diff(other).isEmpty();
  }

  // todo: more tests!
  shr96(shift: number): SquareSet {
    if (shift >= 90) return SquareSet.empty();
    if (shift >= 64) return new SquareSet(this.hi >>> (shift - 64), 0, 0);
    if (shift >= 32) {
      return new SquareSet((this.mid >>> (shift - 32)) ^ (this.hi << (64 - shift)), this.hi >> (shift - 32), 0);
    }
    if (shift > 0) {
      return new SquareSet(
        (this.lo >>> shift) ^ (this.mid << (32 - shift)),
        (this.mid >>> shift) ^ (this.hi << (32 - shift)),
        this.hi >>> shift,
      );
    }
    return this;
  }

  // todo: test me!
  shl96(shift: number): SquareSet {
    if (shift >= 64) return new SquareSet(0, 0, this.lo << (shift - 64));
    if (shift >= 32) {
      return new SquareSet(0, this.lo << (shift - 32), (this.mid << (shift - 32)) ^ (this.lo >>> (64 - shift)));
    }
    if (shift > 0) {
      return new SquareSet(
        this.lo << shift,
        (this.mid << shift) ^ (this.lo >>> (32 - shift)),
        (this.hi << shift) ^ (this.mid >>> (32 - shift)),
      );
    }
    return this;
  }

  // TODO: uncomment and test when working on hyperbola quintessence
  // bswap64(): SquareSet {
  //   const lead_six = new SquareSet(0x0, 0x0, (bswap32(this.lo) >> 6) & 0x03F00000);
  //   return new SquareSet(bswap32(this.hi), bswap32(this.mid), bswap32(this.lo)).shr96(6).union(lead_six);
  // }

  // rbit64(): SquareSet {
  //   const lead_six = new SquareSet(0x0, 0x0, (rbit32(this.lo) >> 6) & 0x03F00000);
  //   return new SquareSet(rbit32(this.hi), rbit32(this.mid), rbit32(this.lo)).shr96(6).union(lead_six);
  // }

  // minus64(other: SquareSet): SquareSet {
  //   const lo = this.lo - other.lo;
  //   const c_mid = ((lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1)) >>> 31;
  //   const mid = this.mid - (other.mid + c_mid);
  //   const c_hi = ((mid & other.mid & 1) + (other.mid >>> 1) + (mid >>> 1)) >>> 31;
  //   return new SquareSet(lo, mid, this.hi - (other.hi + c_hi));
  // }

  equals(other: SquareSet): boolean {
    return this.lo === other.lo && this.mid === other.mid && this.hi === other.hi;
  }

  size(): number {
    return popcnt32(this.lo) + popcnt32(this.mid) + popcnt32(this.hi);
  }

  isEmpty(): boolean {
    return this.lo === 0 && this.mid === 0 && this.hi === 0;
  }

  nonEmpty(): boolean {
    return this.lo !== 0 || this.mid !== 0 || this.hi !== 0;
  }

  has(square: Square): boolean {
    return (square >= 64
      ? this.hi & (1 << (square - 64))
      : square >= 32
      ? this.mid & (1 << (square - 32))
      : this.lo & (1 << square)) !== 0;
  }

  set(square: Square, on: boolean): SquareSet {
    return on ? this.with(square) : this.without(square);
  }

  with(square: Square): SquareSet {
    return square >= 64
      ? new SquareSet(this.lo, this.mid, this.hi | (1 << (square - 64)))
      : square >= 32
      ? new SquareSet(this.lo, this.mid | (1 << (square - 32)), this.hi)
      : new SquareSet(this.lo | (1 << square), this.mid, this.hi);
  }

  without(square: Square): SquareSet {
    return square >= 64
      ? new SquareSet(this.lo, this.mid, this.hi & ~(1 << (square - 64)))
      : square >= 32
      ? new SquareSet(this.lo, this.mid & ~(1 << (square - 32)), this.hi)
      : new SquareSet(this.lo & ~(1 << square), this.mid, this.hi);
  }

  toggle(square: Square): SquareSet {
    return square >= 64
      ? new SquareSet(this.lo, this.mid, this.hi ^ (1 << (square - 64)))
      : square >= 32
      ? new SquareSet(this.lo, this.mid ^ (1 << (square - 32)), this.hi)
      : new SquareSet(this.lo ^ (1 << square), this.mid, this.hi);
  }

  last(): Square | undefined {
    if (this.hi !== 0) return 95 - Math.clz32(this.hi);
    if (this.mid !== 0) return 63 - Math.clz32(this.mid);
    if (this.lo !== 0) return 31 - Math.clz32(this.lo);
    return;
  }

  first(): Square | undefined {
    if (this.lo !== 0) return 31 - Math.clz32(this.lo & -this.lo);
    if (this.mid !== 0) return 63 - Math.clz32(this.mid & -this.mid);
    if (this.hi !== 0) return 95 - Math.clz32(this.hi & -this.hi);
    return;
  }

  withoutFirst(): SquareSet {
    if (this.lo !== 0) return new SquareSet(this.lo & (this.lo - 1), this.mid, this.hi);
    if (this.mid !== 0) return new SquareSet(0, this.mid & (this.mid - 1), this.hi);
    return new SquareSet(0, 0, this.hi & (this.hi - 1));
  }

  moreThanOne(): boolean {
    return (this.hi !== 0 && this.lo !== 0)
      || (this.hi !== 0 && this.mid !== 0)
      || (this.mid !== 0 && this.lo !== 0)
      || (this.lo & (this.lo - 1)) !== 0
      || (this.mid & (this.mid - 1)) !== 0
      || (this.hi & (this.hi - 1)) !== 0;
  }

  singleSquare(): Square | undefined {
    return this.moreThanOne() ? undefined : this.last();
  }

  *[Symbol.iterator](): Iterator<Square> {
    let lo = this.lo;
    let mid = this.mid;
    let hi = this.hi;
    while (lo !== 0) {
      const idx = 31 - Math.clz32(lo & -lo);
      lo ^= 1 << idx;
      yield idx;
    }
    while (mid !== 0) {
      const idx = 31 - Math.clz32(mid & -mid);
      mid ^= 1 << idx;
      yield 32 + idx;
    }
    while (hi !== 0) {
      const idx = 31 - Math.clz32(hi & -hi);
      hi ^= 1 << idx;
      yield 64 + idx;
    }
  }

  *reversed(): Iterable<Square> {
    let lo = this.lo;
    let mid = this.mid;
    let hi = this.hi;
    while (hi !== 0) {
      const idx = 31 - Math.clz32(hi);
      hi ^= 1 << idx;
      yield 64 + idx;
    }
    while (mid !== 0) {
      const idx = 31 - Math.clz32(mid);
      mid ^= 1 << idx;
      yield 32 + idx;
    }
    while (lo !== 0) {
      const idx = 31 - Math.clz32(lo);
      lo ^= 1 << idx;
      yield idx;
    }
  }
}
