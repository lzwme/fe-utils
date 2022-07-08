/** 通用 package.json 类型定义 */
export interface PackageInfo extends Record<string, unknown> {
  name: string;
  version: string;
  author?: Record<string, string>;
  bin?: Record<string, string>;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  main?: string;
  scripts?: Record<string, string>;
  publishConfig?: {
    access: string;
    registry: string;
  };
  typings?: string;
  type?: string;
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  };
  module?: string;
  license?: string;
  keywords?: string[];
  packageManager?: string;
  bugs?: Record<string, string>;
  homepage?: string;
  directories?: Record<string, string>;
  maintainers?: {
    name: string;
    email: string;
  }[];
  pnpm?: {
    overrides?: Record<string, string>;
  } & Record<string, unknown>;
  resolutions?: Record<string, string>;
}

/**
 * npm registry 返回结果类型定义
 * {@see https://registry.npmjs.com/@lzwme/fed-lint-helper}
 */
export interface NpmRegistryInfo {
  _id: string;
  _rev: string;
  name: string;
  description: string;
  'dist-tags': {
    latest: string;
    next?: string;
  } & Record<string, string>;
  versions: Record<
    string,
    PackageInfo & {
      _id?: string;
      _npmOperationalInternal?: Record<string, string>;
      _hasShrinkwrap?: boolean;
      _nodeVersion?: string;
      _npmVersion?: string;
      _npmUser?: Record<string, string>;
      dist?: {
        /** tgz 下载地址 */
        tarball: string;
        /** sha hash */
        shasum: string;
      };
      gitHead?: string;
    }
  >;
  time: {
    created: string;
    modified?: string;
    [version: string]: string;
  };
  users?: Record<string, string>;
  keywords?: string[];
  maintainers?: PackageInfo['maintainers'];
  license?: string;
  repository?: PackageInfo['repository'];
  homepage?: string;
  author?: {
    name: string;
    email: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  readme?: string;
  readmeFilename?: string;
}
