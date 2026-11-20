import { Logger } from './Logger';

describe('Logger', () => {
  it('silent() does not print an error-level log', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => void 0);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => void 0);

    try {
      const logger = new Logger('silent-test', { levelType: 'trace' });
      logger.silent('should not be printed');
      expect(errorSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      logSpy.mockRestore();
    }
  });
});
