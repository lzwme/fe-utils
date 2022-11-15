import nfs from 'node:fs';

export let fs = nfs;

try {
  if (typeof process === 'object' && process.versions?.electron) {
    if (typeof require !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ofs = require('original-fs');
      if ('read' in ofs) fs = ofs;
    }
    // @ts-ignore
    // eslint-disable-next-line unicorn/prefer-top-level-await
    else import('original-fs').then(d => (fs = d));
  }
} catch (error) {
  console.error(error);
}

// export const requireFs = () => fs;
