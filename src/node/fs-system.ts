import nfs from 'node:fs';
import process from 'node:process';

export let fs = nfs;

try {
  if (typeof process === 'object' && process.versions?.electron) {
    if (typeof require === 'undefined') {
      // @ts-ignore
      // eslint-disable-next-line unicorn/prefer-top-level-await
      import('original-fs').then(d => (fs = d));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ofs = require('original-fs');
      if ('read' in ofs) fs = ofs;
    }
  }
} catch (error) {
  console.error(error);
}

// export const requireOfs = () => fs;
