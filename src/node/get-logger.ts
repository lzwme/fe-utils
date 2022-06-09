import { color } from 'console-log-colors';
import { NLogger } from './lib/NLogger';
import { type LogLevelType } from '../common/Logger';

export function getLogger(tag = '[general]', levelType?: LogLevelType): NLogger {
  return NLogger.getLogger(tag, { levelType, color });
}
