import { color } from 'console-log-colors';
import { NLogger } from './lib/NLogger';
import { type LogLevelType } from '../common/Logger';

export function getLogger(tag = '[FEUTILS]', levelType?: LogLevelType): NLogger {
  return NLogger.getLogger(tag, { levelType, color });
}
