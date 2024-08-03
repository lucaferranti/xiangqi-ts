# elephantops

[![Test](https://github.com/lucaferranti/elephantops/workflows/Check/badge.svg)](https://github.com/lucaferranti/elephantops/actions/workflows/check.yml)
[![npm](https://img.shields.io/npm/v/elephantops)](https://www.npmjs.com/package/elephantops)

Xiangqi rules and operations in TypeScript. This is a port of [chessops](https://github.com/niklasf/chessops) to xiangqi.

## Documentation

[View TypeDoc](https://lucaferranti.github.io/elephantops/)

## Features

- [Read and write FEN](https://lucaferranti.github.io/elephantops/modules/fen.html)
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
- [Attacks and rays](https://lucaferranti.github.io/elephantops/modules/attacks.html)
- Read and write UCCI move notation
- [Read and write SAN](https://lucaferranti.github.io/elephantops/modules/san.html)
- [Read and write PGN](https://lucaferranti.github.io/elephantops/modules/pgn.html)
  - Parser supports asynchronous streaming
  - Game tree model
  - Transform game tree to augment nodes with arbitrary user data
  - Parse comments with evaluations, clocks and shapes

## Example

```javascript
import { parseFen } from 'elephantops/fen';
import { Xiangqi } from 'elephantops/xiangqi';

const setup = parseFen(
  '1nbakabn1/r7r/1c7/p1p1C1p1p/4C2c1/9/P1P1P1P1P/9/9/RNBAKABNR b - - 4 4',
).unwrap();
const pos = Xiangqi.fromSetup(setup).unwrap();
console.assert(pos.isCheckmate());
```

## License

elephantops is licensed under the GNU General Public License 3 or any later
version at your choice. See LICENSE for details.
