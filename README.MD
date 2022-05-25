[![@lzwme/node-utils](https://nodei.co/npm/@lzwme/node-utils.png)][npm-url]

# @lzwme/node-utils

[![NPM version][npm-badge]][npm-url]
[![node version][node-badge]][node-url]
![license MIT](https://img.shields.io/github/license/lzwme/asmd-calc)

[![build status](https://github.com/lzwme/node-utils/actions/workflows/node-ci.yml/badge.svg)](https://github.com/lzwme/node-utils/actions/workflows/node-ci.yml)
[![npm download][download-badge]][download-url]
[![GitHub issues][issues-badge]][issues-url]
[![GitHub forks][forks-badge]][forks-url]
[![GitHub stars][stars-badge]][stars-url]

前端 node、web 项目开发常用的工具函数集合。主要为在多个项目长期开发实践过程中频繁使用的工具类。部分实现参考借鉴了各流行开源库。

## 功能特性

- 少即是多。只收集高频使用的方法
- 部分工具寒素核心实现收集自各流行开源库
- 支持 tree-shaking 方式调用(esm)
- more...

## 安装

```bash
# use npm
npm i @lzwme/node-utils
# use yarn
yarn add @lzwme/node-utils
# use pnpm
pnpm add @lzwme/node-utils
```

## 使用

`commonjs` 示例：

```ts
import { TsCheck, ESLintCheck } from '@lzwme/node-utils';
```

`es module` 示例：

```ts
import {  } from '@lzwme/node-utils';
```

更多细节可参考 [API 文档](https://lzw.me/doc/node-utils)。

## 开发

本地二次开发：

```bash
git clone https://github.com/lzwme/node-utils
yarn install
npm link
yarn dev
```

或者 [fork]() 本项目进行代码贡献。

**欢迎贡献想法与代码。**

## Thanks

- https://github.com/microsoft/vscode

## License

`@lzwme/node-utils` is released under the MIT license.

该插件由[志文工作室](https://lzw.me)开发和维护。


[stars-badge]: https://img.shields.io/github/stars/lzwme/node-utils.svg
[stars-url]: https://github.com/lzwme/node-utils/stargazers
[forks-badge]: https://img.shields.io/github/forks/lzwme/node-utils.svg
[forks-url]: https://github.com/lzwme/node-utils/network
[issues-badge]: https://img.shields.io/github/issues/lzwme/node-utils.svg
[issues-url]: https://github.com/lzwme/node-utils/issues
[npm-badge]: https://img.shields.io/npm/v/@lzwme/node-utils.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@lzwme/node-utils
[node-badge]: https://img.shields.io/badge/node.js-%3E=_14.0.0-green.svg?style=flat-square
[node-url]: https://nodejs.org/download/
[download-badge]: https://img.shields.io/npm/dm/@lzwme/node-utils.svg?style=flat-square
[download-url]: https://npmjs.org/package/@lzwme/node-utils
[bundlephobia-url]: https://bundlephobia.com/result?p=@lzwme/node-utils@latest
[bundlephobia-badge]: https://badgen.net/bundlephobia/minzip/@lzwme/node-utils@latest
