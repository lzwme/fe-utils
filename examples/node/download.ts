import { download, rmrf, NLogger, formatByteSize } from '../../src';

const argv = new Set(process.argv.slice(2));
const logger = NLogger.getLogger();

download({
  url: 'https://vscode.cdn.azure.cn/stable/97dec172d3256f8ca4bfb2143f3f76b503ca0534/VSCodeUserSetup-x64-1.74.3.exe?1',
  onProgress(d) {
    logger.logInline(`${formatByteSize(d.size)} ${formatByteSize(d.downloaded)} ${d.percent.toFixed(2)}% ${formatByteSize(d.speed)}/S`);
  },
})
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .then(d => {
    console.log(d);
    if (argv.has('test')) rmrf(d.filepath);
  });
