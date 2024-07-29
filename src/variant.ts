import { Result } from '@badrap/result';
import { Setup } from './setup.js';
import { Rules } from './types.js';
import { Position, PositionError, Xiangqi } from './xiangqi.js';

export { Position, PositionError };

export const defaultPosition = (rules: Rules): Position => {
  switch (rules) {
    case 'xiangqi':
      return Xiangqi.default();
  }
};

export const setupPosition = (rules: Rules, setup: Setup): Result<Position, PositionError> => {
  switch (rules) {
    case 'xiangqi':
      return Xiangqi.fromSetup(setup);
  }
};
