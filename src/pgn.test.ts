import { expect, jest, test } from '@jest/globals';
import { createReadStream } from 'fs';
import { makeFen } from './fen.js';
import {
  ChildNode,
  defaultGame,
  emptyHeaders,
  extend,
  Game,
  isChildNode,
  makeComment,
  makePgn,
  Node,
  parseComment,
  parsePgn,
  PgnError,
  PgnNodeData,
  PgnParser,
  startingPosition,
  transform,
} from './pgn.js';
import { parseSan } from './san.js';
import { Position } from './xiangqi.js';

interface GameCallback {
  (game: Game<PgnNodeData>, err: PgnError | undefined): Error | void;
}

function testPgnFile({ fileName = '', numberOfGames = 1, allValid = true } = {}, ...callbacks: GameCallback[]) {
  test(`pgn file - ${fileName}`, done => {
    const stream = createReadStream(`./data/${fileName}.pgn`, { encoding: 'utf-8' });
    const gameCallback = jest.fn((game: Game<PgnNodeData>, err: PgnError | undefined) => {
      if (err) stream.destroy(err);
      if (allValid) expect(err).toBe(undefined);
      callbacks.forEach(callback => {
        expect(callback(game, err)).toBe(undefined);
      });
    });
    const parser = new PgnParser(gameCallback, emptyHeaders);
    stream
      .on('data', (chunk: string) => parser.parse(chunk, { stream: true }))
      .on('close', () => {
        parser.parse('');
        expect(gameCallback).toHaveBeenCalledTimes(numberOfGames);
        done!();
      });
  });
}

test('make pgn', () => {
  const root = new Node<PgnNodeData>();
  expect(isChildNode(root)).toBe(false);

  const Che3 = new ChildNode<PgnNodeData>({
    san: 'Che3',
    nags: [7],
  });
  expect(isChildNode(Che3)).toBe(true);
  const Bge3 = new ChildNode<PgnNodeData>({ san: 'Bge3' });
  root.children.push(Che3);
  root.children.push(Bge3);

  const Ng8 = new ChildNode<PgnNodeData>({
    san: 'Ng8',
  });
  const Che8 = new ChildNode<PgnNodeData>({ san: 'Che8' });
  Che3.children.push(Ng8);
  Che3.children.push(Che8);

  const Ng3 = new ChildNode<PgnNodeData>({
    san: 'Ng3',
    comments: ['a comment'],
  });
  Che8.children.push(Ng3);

  const Ni3 = new ChildNode<PgnNodeData>({ san: 'Ni3' });
  Ng8.children.push(Ni3);

  expect(makePgn({ headers: emptyHeaders(), moves: root })).toEqual(
    '1. Che3 $7 ( 1. Bge3 ) 1... Ng8 ( 1... Che8 2. Ng3 { a comment } ) 2. Ni3 *\n',
  );
});

test('extend mainline', () => {
  const game: Game<PgnNodeData> = defaultGame(emptyHeaders);
  extend(game.moves.end(), 'Che3 Che8 Ng3 Ng8 Rh1'.split(' ').map(san => ({ san })));
  expect(makePgn(game)).toEqual('1. Che3 Che8 2. Ng3 Ng8 3. Rh1 *\n');
});

test('parse headers', () => {
  const games = parsePgn(
    [
      '[Black "black player"]',
      '[Red " red  player   "]',
      '[Escaped "quote: \\", backslashes: \\\\\\\\, trailing text"]',
      '[Multiple "on"] [the "same line"]',
      '[Incomplete',
    ].join('\r\n'),
  );
  expect(games).toHaveLength(1);
  expect(games[0].headers.get('Black')).toBe('black player');
  expect(games[0].headers.get('Red')).toBe(' red  player   ');
  expect(games[0].headers.get('Escaped')).toBe('quote: ", backslashes: \\\\, trailing text');
  expect(games[0].headers.get('Multiple')).toBe('on');
  expect(games[0].headers.get('the')).toBe('same line');
  expect(games[0].headers.get('Result')).toBe('*');
  expect(games[0].headers.get('Event')).toBe('?');
});

test('parse pgn', () => {
  const callback = jest.fn((game: Game<PgnNodeData>) => {
    expect(makePgn(game)).toBe('[Result "1-0"]\n\n1. Che3 Ng8 2. Ng3 { foo\n  bar baz } 1-0\n');
  });
  const parser = new PgnParser(callback, emptyHeaders);
  parser.parse('1. Che3 \nNg8', { stream: true });
  parser.parse('\nNg3 {foo\n', { stream: true });
  parser.parse('  bar baz } 1-', { stream: true });
  parser.parse('', { stream: true });
  parser.parse('0', { stream: true });
  parser.parse('');
  expect(callback).toHaveBeenCalledTimes(1);
});

test('transform pgn', () => {
  interface TransformResult extends PgnNodeData {
    fen: string;
  }

  const game = parsePgn('1. Pc5 ( 1. Pg5 Pc6 -- ) 1... Pg6')[0];
  const res = transform<PgnNodeData, TransformResult, Position>(
    game.moves,
    startingPosition(game.headers).unwrap(),
    (pos, data) => {
      const move = parseSan(pos, data.san);
      if (!move) return;
      pos.play(move);
      return {
        fen: makeFen(pos.toSetup()),
        ...data,
      };
    },
  );
  expect(res.children[0].data.fen).toBe('rnbakabnr/9/1c5c1/p1p1p1p1p/9/2P6/P3P1P1P/1C5C1/9/RNBAKABNR b - - 1 1');
  expect(res.children[0].children[0].data.fen).toBe(
    'rnbakabnr/9/1c5c1/p1p1p3p/6p2/2P6/P3P1P1P/1C5C1/9/RNBAKABNR w - - 2 2',
  );
  expect(res.children[1].data.fen).toBe('rnbakabnr/9/1c5c1/p1p1p1p1p/9/6P2/P1P1P3P/1C5C1/9/RNBAKABNR b - - 1 1');
  expect(res.children[1].children[0].data.fen).toBe(
    'rnbakabnr/9/1c5c1/p3p1p1p/2p6/6P2/P1P1P3P/1C5C1/9/RNBAKABNR w - - 2 2',
  );
});

testPgnFile({
  fileName: 'full-games',
  numberOfGames: 2,
  allValid: true,
});
testPgnFile(
  {
    fileName: 'headers-and-moves-on-the-same-line',
    numberOfGames: 3,
    allValid: true,
  },
  game => {
    expect(game.headers.get('Variant')).toBe('Standard');
    expect(Array.from(game.moves.mainline()).map(move => move.san)).toStrictEqual([
      'Che3',
      'Che8',
      'Ng3',
      'Ng8',
      'Rh1',
    ]);
  },
);
testPgnFile(
  {
    fileName: 'pathological-headers',
    numberOfGames: 1,
    allValid: true,
  },
  game => {
    expect(game.headers.get('A')).toBe('b"');
    expect(game.headers.get('B')).toBe('b"');
    expect(game.headers.get('C')).toBe('A]]');
    expect(game.headers.get('D')).toBe('A]][');
    expect(game.headers.get('E')).toBe('"A]]["');
    expect(game.headers.get('F')).toBe('"A]]["\\');
    expect(game.headers.get('G')).toBe('"]');
  },
);
testPgnFile(
  {
    fileName: 'leading-whitespace',
    numberOfGames: 4,
    allValid: true,
  },
  game => {
    expect(Array.from(game.moves.mainline()).map(move => move.san)).toStrictEqual([
      'Che3',
      'Che8',
      'Ng3',
      'Ng8',
      'Rh1',
    ]);
  },
);

test('tricky tokens', () => {
  const steps = Array.from(parsePgn('Re3+ !! Rxe3# ??')[0].moves.mainline());
  expect(steps[0].san).toBe('Re3+');
  expect(steps[0].nags).toEqual([3]);
  expect(steps[1].san).toBe('Rxe3#');
  expect(steps[1].nags).toEqual([4]);
});

test('parse comment', () => {
  expect(parseComment('prefix [%emt 1:02:03.4]')).toEqual({
    text: 'prefix',
    emt: 3723.4,
    shapes: [],
  });
  expect(parseComment('[%csl Ya1][%cal Ra1a1,Be1e2]commentary [%csl Gh8]')).toEqual({
    text: 'commentary',
    shapes: [
      { color: 'yellow', from: 0, to: 0 },
      { color: 'red', from: 0, to: 0 },
      { color: 'blue', from: 4, to: 13 },
      { color: 'green', from: 70, to: 70 },
    ],
  });
  expect(parseComment('[%eval -0.42] suffix')).toEqual({
    text: 'suffix',
    evaluation: { pawns: -0.42 },
    shapes: [],
  });
  expect(parseComment('prefix [%eval .99,23]')).toEqual({
    text: 'prefix',
    evaluation: { pawns: 0.99, depth: 23 },
    shapes: [],
  });
  expect(parseComment('[%eval #-3] suffix')).toEqual({
    text: 'suffix',
    evaluation: { mate: -3 },
    shapes: [],
  });
  expect(parseComment('[%csl Ga1]foo')).toEqual({
    text: 'foo',
    shapes: [{ from: 0, to: 0, color: 'green' }],
  });
  expect(parseComment('foo [%bar] [%csl Ga1] [%cal Ra1h1,Gb1b8] [%clk 3:25:45]').text).toBe('foo [%bar]');
});

test('make comment', () => {
  expect(
    makeComment({
      text: 'text',
      emt: 3723.4,
      evaluation: { pawns: 10 },
      clock: 1,
      shapes: [
        { color: 'yellow', from: 0, to: 0 },
        { color: 'red', from: 0, to: 1 },
        { color: 'red', from: 0, to: 2 },
      ],
    }),
  ).toBe('text [%csl Ya1] [%cal Ra1b1,Ra1c1] [%eval 10.00] [%emt 1:02:03.4] [%clk 0:00:01]');

  expect(
    makeComment({
      evaluation: { mate: -4, depth: 5 },
    }),
  ).toBe('[%eval #-4,5]');
});

test.each([
  '[%csl[%eval 0.2] Ga1]',
  '[%c[%csl [%csl Ga1[%csl Ga1][%[%csl Ga1][%cal[%csl Ga1]Ra1]',
  '[%csl Ga1][%cal Ra1h1,Gb1b8] foo [%clk 3:ê5: [%eval 450752] [%evaÿTæ<92>ÿÿ^?,7]',
])('roundtrip comment', str => {
  const comment = parseComment(str);
  const rountripped = parseComment(makeComment(comment));
  expect(comment).toEqual(rountripped);
});
