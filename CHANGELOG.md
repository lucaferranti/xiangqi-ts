# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.1](https://github.com/lucaferranti/elephantops/releases/tag/v0.1.1) -- 2023-08-04

### Added

- Add compatibility with [xiangqiground](https://github.com/lucaferranti/xiangqiground) [82a3d40](https://github.com/lucaferranti/elephantops/commit/82a3d409c0984b3bb6b7c24f400aa41cfbe83787).

### Changed

- Support `E/e` and `H/h` notation for horse and elephant, respectively, in FEN/SAN/PGN [8174e8a](https://github.com/lucaferranti/elephantops/commit/8174e8a48835d11d6f5335a0cb96fb5cd0acf2fe).

### Fixed

- Fix bug in move generation. When checking if a square is attacked, horizontal movements of promoted pawns were not considered [4d6af7](https://github.com/lucaferranti/elephantops/commit/4d6af76005df4c8d7a619b3d67b6da34a4c3319f).

## [v0.1.0](https://github.com/lucaferranti/elephantops/releases/tag/v0.1.0) -- 2023-08-03

Initial release.

### Added

- Initial move generation
- Initial FEN, SAN and PGN parsing / writing
- Bitboard datastructure and operations on it
- Position validation
