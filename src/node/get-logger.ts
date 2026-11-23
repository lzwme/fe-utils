import { color } from 'console-log-colors';
import type { LogLevelType } from '../common/lib/Logger';
import { NLogger } from './lib/NLogger';

export function getLogger(tag = '[FEUTILS]', levelType?: LogLevelType): NLogger {
  return NLogger.getLogger(tag, { levelType, color });
}
