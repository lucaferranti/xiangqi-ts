# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Add compatibility with [xiangqiground](https://github.com/lucaferranti/xiangqiground).

### Changed

- Support `E/e` and `H/h` notation for horse and elephant, respectively, in FEN/SAN/PGN.

### Fixed

- Fix bug in move generation. When checking if a square is attacked, horizontal movements of promoted pawns were not considered.

## [v0.1.0](https://github.com/lucaferranti/elephantops/releases/tag/v0.1.0) -- 2023-08-03

Initial release.

### Added

- Initial move generation
- Initial FEN, SAN and PGN parsing / writing
- Bitboard datastructure and operations on it
- Position validation
