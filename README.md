# xiangqi-ts

[![Test](https://github.com/lucaferranti/xiangqi-ts/workflows/Test/badge.svg)](https://github.com/lucaferranti/xiangqi-ts/actions)
[![npm](https://img.shields.io/npm/v/xiangqi-ts)](https://www.npmjs.com/package/xiangqi-ts)

Xiangqi rules and operations in TypeScript. This is a port of [chessops](https://github.com/niklasf/chessops) to xiangqi.

## Documentation

[View TypeDoc](https://lucaferranti.github.io/xiangqi-ts/)

## Features

- [Read and write FEN](https://lucaferranti.github.io/xiangqi-ts/modules/fen.html)
- Vocabulary
  - `Square`
  - `SquareSet` (implemented as bitboards)
  - `Color`
  - `Role` (piece type)
  - `Piece` (`Role` and `Color`)
  - `Board` (map of piece positions)
  - `Setup` (a not necessarily legal position)
  - `Position` (base class for legal positions, `Xiangqi` is a concrete implementation)
  - Move making
  - Legal move generation
  - Game end and outcome
  - Insufficient material
  - Setup validation
- [Attacks and rays](https://lucaferranti.github.io/xiangqi-ts/modules/attacks.html)
- Read and write UCCI move notation
- [Read and write SAN](https://lucaferranti.github.io/xiangqi-ts/modules/san.html)
- [Read and write PGN](https://lucaferranti.github.io/xiangqi-ts/modules/pgn.html)
  - Parser supports asynchronous streaming
  - Game tree model
  - Transform game tree to augment nodes with arbitrary user data
  - Parse comments with evaluations, clocks and shapes

## Example

```javascript
import { parseFen } from 'xiangqi-ts/fen';
import { Xiangqi } from 'xiangqi-ts/xiangqi';

const setup = parseFen(
  '1nbakabn1/r7r/1c7/p1p1C1p1p/4C2c1/9/P1P1P1P1P/9/9/RNBAKABNR b - - 4 4',
).unwrap();
const pos = Xiangqi.fromSetup(setup).unwrap();
console.assert(pos.isCheckmate());
```

## License

xiangqi-ts is licensed under the GNU General Public License 3 or any later
version at your choice. See LICENSE for details.
