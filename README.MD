[![@lzwme/fe-utils](https://nodei.co/npm/@lzwme/fe-utils.png)][npm-url]

# @lzwme/fe-utils

[![NPM version][npm-badge]][npm-url]
[![node version][node-badge]][node-url]
![license MIT](https://img.shields.io/github/license/lzwme/fe-utils)

[![build status](https://github.com/lzwme/fe-utils/actions/workflows/node-ci.yml/badge.svg)](https://github.com/lzwme/fe-utils/actions/workflows/node-ci.yml)
[![npm download][download-badge]][download-url]
[![GitHub issues][issues-badge]][issues-url]
[![GitHub forks][forks-badge]][forks-url]
[![GitHub stars][stars-badge]][stars-url]

前端 node、web 项目开发常用的工具函数集合。主要为在多个项目长期开发实践过程中频繁使用的工具类。部分实现参考借鉴了各流行开源库。

## 功能特性

- 少即是多。只收集高频使用的方法
- 部分工具函数核心实现收集自各流行开源库
- 支持 tree-shaking 方式调用(esm)
- more...

## 安装

```bash
# use npm
npm i @lzwme/fe-utils
# use yarn
yarn add @lzwme/fe-utils
# use pnpm
pnpm add @lzwme/fe-utils
```

## 使用

默认导出为 `Node.js` 下的工具集。

`commonjs` 示例：

```ts
const { md5, getLoger } = rquire('@lzwme/fe-utils');
const logger = getLoger();

logger.info(md5('123456'));
```

`es module` 示例：

```ts
import { dateFormat } from '@lzwme/fe-utils';

console.log(dateFormat('yyyy-MM-dd', new Date()));
```

在纯浏览器的 `web` 项目中使用示例：

```ts
import { dateFormat, Logger } from '@lzwme/fe-utils/esm/web';

const logger = Logger.getLogger();
logger.log(dateFormat('yyyy-MM-dd', new Date()));
```

更多细节可参考 [API 文档](https://lzwme.github.io/fe-utils/)。

## 开发

本地二次开发：

```bash
git clone https://github.com/lzwme/fe-utils
yarn install
npm link
yarn dev
```

或者 [fork](https://github.com/lzwme/fe-utils/fork) 本项目进行代码贡献。

**欢迎贡献想法与代码。**

## Thanks

- https://github.com/microsoft/vscode

## License

`@lzwme/fe-utils` is released under the MIT license.

该插件由[志文工作室](https://lzw.me)开发和维护。


[stars-badge]: https://img.shields.io/github/stars/lzwme/fe-utils.svg
[stars-url]: https://github.com/lzwme/fe-utils/stargazers
[forks-badge]: https://img.shields.io/github/forks/lzwme/fe-utils.svg
[forks-url]: https://github.com/lzwme/fe-utils/network
[issues-badge]: https://img.shields.io/github/issues/lzwme/fe-utils.svg
[issues-url]: https://github.com/lzwme/fe-utils/issues
[npm-badge]: https://img.shields.io/npm/v/@lzwme/fe-utils.svg?style=flat-square
[npm-url]: https://npmjs.com/package/@lzwme/fe-utils
[node-badge]: https://img.shields.io/badge/node.js-%3E=_14.0.0-green.svg?style=flat-square
[node-url]: https://nodejs.org/download/
[download-badge]: https://img.shields.io/npm/dm/@lzwme/fe-utils.svg?style=flat-square
[download-url]: https://npmjs.com/package/@lzwme/fe-utils
[bundlephobia-url]: https://bundlephobia.com/result?p=@lzwme/fe-utils@latest
[bundlephobia-badge]: https://badgen.net/bundlephobia/minzip/@lzwme/fe-utils@latest
