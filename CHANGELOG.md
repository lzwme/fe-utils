# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.7.2](https://github.com/lzwme/fe-utils/compare/v1.7.1...v1.7.2) (2024-03-15)


### Bug Fixes

* 修复 color 导出导致的引用异常 ([12e1a4c](https://github.com/lzwme/fe-utils/commit/12e1a4c18004412f5af077458f2364f99aa3ede2))

### [1.7.1](https://github.com/lzwme/fe-utils/compare/v1.7.0...v1.7.1) (2024-03-15)


### Bug Fixes

* **LiteStorage:** 修复 setItem 方法 value 为数组时异常的问题 ([19cb525](https://github.com/lzwme/fe-utils/commit/19cb52530bcadda79bc1937bbf236923c0939ab1))
* **ReqFetch:** 浏览器环境下设置默认 prefixUrl 值，修复 pathname 格式的 api 请求异常的问题 ([e70a76e](https://github.com/lzwme/fe-utils/commit/e70a76e8385d9c5f2091cfc41808131483990582))

## [1.7.0](https://github.com/lzwme/fe-utils/compare/v1.6.0...v1.7.0) (2024-02-28)


### Features

* **TOTP:** 新增 TOTP 类，用于 Node.js 下简易的验证 2FA ([34a3d28](https://github.com/lzwme/fe-utils/commit/34a3d28380d1498d1ca92f3d3de48dca48e4e782))


### Bug Fixes

* **LiteStorage:** 修复 filepath 为目录时无效的问题 ([cd4842f](https://github.com/lzwme/fe-utils/commit/cd4842f479a13a40318d5fc3aa3e5e934b1f93a8))

## [1.6.0](https://github.com/lzwme/fe-utils/compare/v1.5.10...v1.6.0) (2024-01-16)


### Features

* 新增基于 fetch 的通用 API 请求简易封装类 ([82a1e83](https://github.com/lzwme/fe-utils/commit/82a1e834de8f6caf547536a4bd854f24c46e65e4))
* **cookie:** 新增 cookie 解析相关方法 ([9902d02](https://github.com/lzwme/fe-utils/commit/9902d02cc0d9d874c0b087b8fa65adbd13a9e1c0))
* **Logger:** 增加 trace 日志级别，用于调试跟踪更细粒度的日志 ([eddf027](https://github.com/lzwme/fe-utils/commit/eddf02734d11db77d06003a15cd5912cb750c544))

### [1.5.10](https://github.com/lzwme/fe-utils/compare/v1.5.9...v1.5.10) (2024-01-08)


### Bug Fixes

* **objects:** 优化 load json5 在 cjs 模式下的逻辑 ([50aba5f](https://github.com/lzwme/fe-utils/commit/50aba5f063d99fb63c1ec84814ece459e22290ec))

### [1.5.9](https://github.com/lzwme/fe-utils/compare/v1.5.8...v1.5.9) (2024-01-08)

### [1.5.8](https://github.com/lzwme/fe-utils/compare/v1.5.7...v1.5.8) (2023-12-07)


### Bug Fixes

* **LiteStorage:** remove debug code ([092f569](https://github.com/lzwme/fe-utils/commit/092f569d1491f70c6fd84dbc968a72192755151c))

### [1.5.7](https://github.com/lzwme/fe-utils/compare/v1.5.6...v1.5.7) (2023-12-07)

### [1.5.6](https://github.com/lzwme/fe-utils/compare/v1.5.5...v1.5.6) (2023-11-03)


### Bug Fixes

* **gitHasUnstagedChanges:** 增加 dir 输入参数，支持针对指定的文件或目录检测是否存在未提交的变更 ([915f78c](https://github.com/lzwme/fe-utils/commit/915f78cd9c700609ffcf535ae059c5b95de31a62))

### [1.5.5](https://github.com/lzwme/fe-utils/compare/v1.5.4...v1.5.5) (2023-08-18)


### Bug Fixes

* 修复 gitHasUnstagedChanges 方法返回值错误的问题 ([9dcc652](https://github.com/lzwme/fe-utils/commit/9dcc6529a05d0f71559a84e7a1a2a193bb4df9a2))

### [1.5.4](https://github.com/lzwme/fe-utils/compare/v1.5.4-0...v1.5.4) (2023-08-18)

### [1.5.4-0](https://github.com/lzwme/fe-utils/compare/v1.5.3...v1.5.4-0) (2023-08-18)

### [1.5.3](https://github.com/lzwme/fe-utils/compare/v1.5.2...v1.5.3) (2023-08-18)

### [1.5.2](https://github.com/lzwme/fe-utils/compare/v1.5.1...v1.5.2) (2023-06-29)


### Bug Fixes

* **LiteStorage:** 更新默认相对路径的取值规则 ([e3cd8c7](https://github.com/lzwme/fe-utils/commit/e3cd8c7d3e189e30d39cb1e7463bfdf070fb7caa))
* should export for httpLinkChecker ([d1bbaa4](https://github.com/lzwme/fe-utils/commit/d1bbaa45ead9e7d9934bddd93fdd8b891b17e3e3))

### [1.5.1](https://github.com/lzwme/fe-utils/compare/v1.5.0...v1.5.1) (2023-03-26)


### Features

* **request:** 新增 httpLinkChecker 方法；重构 Request 和 download 实现 ([b2121ce](https://github.com/lzwme/fe-utils/commit/b2121ce5664eb69307fc1c256cd5251388f38c6e))

## [1.5.0](https://github.com/lzwme/fe-utils/compare/v1.3.3...v1.5.0) (2023-03-07)


### Features

* 新增 LRUCache 工具类 ([10cec08](https://github.com/lzwme/fe-utils/commit/10cec083dbc5a6050e496a37696948b04b631dfe))
* **node/download:** 新增支持并发分段下载的 download 工具方法 ([6b57d2d](https://github.com/lzwme/fe-utils/commit/6b57d2dbc01804266c1ffdab78fcc02979cafd1f))
* **node/lib:** add WorkerPool.ts ([eab962b](https://github.com/lzwme/fe-utils/commit/eab962b604f87a8bf33bab6ef02dc5405b293029))
* **objects:** 新增 mergeArrayLike 方法，支持数组合并与去重 ([5a8561c](https://github.com/lzwme/fe-utils/commit/5a8561cd55230bb3cc911470d9f9bc8ff041fea1))


### Bug Fixes

* **request:** 支持 302 跳转的最终请求返回 ([686d2a8](https://github.com/lzwme/fe-utils/commit/686d2a8caac33169eed0d9f2afbca1f7ed1bd421))
* **rmrf:** 文件夹删除后移除空目录 ([71c46b3](https://github.com/lzwme/fe-utils/commit/71c46b34c7df9279dff917363d5bde9946292cb0))

## [1.4.0](https://github.com/lzwme/fe-utils/compare/v1.3.3...v1.4.0) (2023-02-18)


### Features

* 新增 LRUCache 工具类 ([10cec08](https://github.com/lzwme/fe-utils/commit/10cec083dbc5a6050e496a37696948b04b631dfe))
* **node/download:** 新增支持并发分段下载的 download 工具方法 ([6b57d2d](https://github.com/lzwme/fe-utils/commit/6b57d2dbc01804266c1ffdab78fcc02979cafd1f))
* **node/lib:** add WorkerPool.ts ([eab962b](https://github.com/lzwme/fe-utils/commit/eab962b604f87a8bf33bab6ef02dc5405b293029))
* **objects:** 新增 mergeArrayLike 方法，支持数组合并与去重 ([5a8561c](https://github.com/lzwme/fe-utils/commit/5a8561cd55230bb3cc911470d9f9bc8ff041fea1))


### Bug Fixes

* **rmrf:** 文件夹删除后移除空目录 ([71c46b3](https://github.com/lzwme/fe-utils/commit/71c46b34c7df9279dff917363d5bde9946292cb0))

### [1.3.3](https://github.com/lzwme/fe-utils/compare/v1.3.2...v1.3.3) (2023-01-27)

### [1.3.2](https://github.com/lzwme/fe-utils/compare/v1.3.1...v1.3.2) (2022-11-25)

### [1.3.1](https://github.com/lzwme/fe-utils/compare/v1.3.0...v1.3.1) (2022-11-16)

## [1.3.0](https://github.com/lzwme/fe-utils/compare/v1.2.1...v1.3.0) (2022-11-15)


### Features

* **NLogger:** 增加日志文件自动清理支持 ([877bfef](https://github.com/lzwme/fe-utils/commit/877bfef414d3119b664a042548190c5b1e040196))

### [1.2.1](https://github.com/lzwme/fe-utils/compare/v1.2.0...v1.2.1) (2022-11-15)


### Bug Fixes

* 更新 md5 方法实现，计算完成后应主动释放创建的 stream 流 ([f5d99da](https://github.com/lzwme/fe-utils/commit/f5d99da200b45c6d19dcc9d25037cef812cb3b6a))

## [1.2.0](https://github.com/lzwme/fe-utils/compare/v1.1.0...v1.2.0) (2022-11-14)


### Features

* 新增 readJsonFile 和 readJsonFileSync 方法 ([bdf9b79](https://github.com/lzwme/fe-utils/commit/bdf9b7957179df499480f1098156ebdb18c48f0e))

## [1.1.0](https://github.com/lzwme/fe-utils/compare/v1.0.0...v1.1.0) (2022-09-27)


### Features

* add method isGitRepo ([184259e](https://github.com/lzwme/fe-utils/commit/184259e166b53c805befd1a4c0f697e45e8b5260))
* add semver.ts ([4ae2fe1](https://github.com/lzwme/fe-utils/commit/4ae2fe1d0ca5b4d7018fbb5ac189a447c350d4b2))

## [1.0.0](https://github.com/lzwme/fe-utils/compare/v0.0.5...v1.0.0) (2022-09-07)


### Features

* 新增 LiteStorage 轻量级持久化存储类 ([b9165a8](https://github.com/lzwme/fe-utils/commit/b9165a8abe72b52ee46130ee1ab32a4916b3650f))
* add createFilter; enable tsconfig.strictNullChecks ([f8ce75b](https://github.com/lzwme/fe-utils/commit/f8ce75b7faea38df483ae37dc0c40bb8783013ac))
* add some util methods ([da33bfd](https://github.com/lzwme/fe-utils/commit/da33bfdb8946b295e09860da19a4423638447368))


### Bug Fixes

* 优化 assign 方法执行逻辑 ([e8928c9](https://github.com/lzwme/fe-utils/commit/e8928c994b77ef873ab2b1737911bab445fd1e5a))
* update for Logger ([c894c94](https://github.com/lzwme/fe-utils/commit/c894c9416bb10dab9c0765a47f1dfabfb3a02463))

### [0.0.5](https://github.com/lzwme/fe-utils/compare/v0.0.4...v0.0.5) (2022-07-28)


### Bug Fixes

* 修复 formatTimeCost 逻辑异常问题 ([6e7eebc](https://github.com/lzwme/fe-utils/commit/6e7eebc8bb7d0466f8b125717d7d937daa2b0b3e))

### [0.0.4](https://github.com/lzwme/fe-utils/compare/v0.0.3...v0.0.4) (2022-07-26)

### [0.0.3](https://github.com/lzwme/fe-utils/compare/v0.0.2...v0.0.3) (2022-07-26)


### Features

* 新增 setQuickEdit 和 tryKillProcess 方法 ([4dd7a00](https://github.com/lzwme/fe-utils/commit/4dd7a00074d2fd6761d677894ca72d5fca451dd8))
* 新增方法 writeToClipBoard ([d27a06b](https://github.com/lzwme/fe-utils/commit/d27a06b2ad2cdcc26fa6b076487d14761e72c03c))

### [0.0.2](https://github.com/lzwme/fe-utils/compare/v0.0.1...v0.0.2) (2022-07-22)


### Bug Fixes

* 更新 simpleAssgin 方法，防止循环依赖导致的异常 ([c2a6824](https://github.com/lzwme/fe-utils/commit/c2a68242638f65fb8ad8023330a39e626f6da369))

### 0.0.1 (2022-06-10)
