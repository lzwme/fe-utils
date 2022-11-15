/*
 * @Author: lzw
 * @Date: 2021-04-23 10:44:32
 * @LastEditors: lzw
 * @LastEditTime: 2022-11-15 15:35:03
 * @Description: gh u 相关的命令。主要为常用的快捷工具方法
 */

import { resolve } from 'node:path';
import { fs } from './fs-system';
import { execSync } from './exec';

/** 获取当前的本地分支名 */
export function getHeadBranch(baseDirectory = process.cwd()) {
  // 支持在 Jenkins CI 中从环境变量直接获取
  let branch = process.env.CI_COMMIT_REF_NAME;

  if (!branch) {
    const headPath = resolve(baseDirectory, './.git/HEAD');

    if (fs.existsSync(headPath)) {
      const head = fs.readFileSync(headPath, { encoding: 'utf8' });
      branch = head.split('refs/heads/')[1];
    }
  }

  if (!branch) {
    // exec 速度比较慢
    branch = execSync('git rev-parse --abbrev-ref HEAD', 'pipe').stdout;
  }

  return branch.trim();
}

/** 获取本地或远端最新的 commitId */
export function getHeadCommitId(isRemote = false) {
  return execSync(`git rev-parse ${isRemote ? '@{upstream}' : 'HEAD'}`, 'pipe').stdout;
}

/**
 * 获取指定 HEAD 的变更文件列表
 * @param headIndex HEAD 顺序，默认为 0，即最新的本地未提交变更
 */
export function getHeadDiffFileList(headIndex = 0, cwd?: string, debug = false) {
  return execSync(`git diff HEAD~${headIndex} --name-only`, 'pipe', cwd, debug).stdout.trim().split('\n').filter(Boolean);
}

/** 获取 git user eamil 地址 */
export function getUserEmail() {
  return execSync('git config --get user.email', 'pipe').stdout;
}

/** 给文件增加或撤销可执行权限 */
export function setChmod(filepath: string, type: 'add' | 'del' = 'add') {
  return execSync(`git update-index --add --chmod=${type === 'del' ? '-' : '+'}x ${filepath}`);
}

/** 判断给定的目录是否为一个 git 仓库 */
export function isGitRepo(rootDir = process.cwd(), useCache = true): boolean {
  // @ts-ignore
  if (isGitRepo[rootDir] == null || !useCache) {
    // @ts-ignore
    isGitRepo[rootDir] =
      fs.existsSync(resolve(rootDir, '.git/config')) || execSync('git branch --show-current', 'pipe', rootDir).error == null;
  }
  // @ts-ignore
  return isGitRepo[rootDir];
}
