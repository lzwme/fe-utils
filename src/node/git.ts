/*
 * @Author: lzw
 * @Date: 2021-04-23 10:44:32
 * @LastEditors: renxia
 * @LastEditTime: 2025-05-26 10:13:50
 * @Description: gh u 相关的命令。主要为常用的快捷工具方法
 */

import { resolve } from 'node:path';
import { fs } from './fs-system';
import { execSync } from './exec';

/** getGitLog 返回项的格式 */
export interface GitLogItem {
  /** hash 提交对象（commit）的完整哈希字串 */
  H?: string;
  /** abbrevHash 提交对象的简短哈希字串 */
  h?: string;
  /** treeHash 树对象（tree）的完整哈希字串 */
  T?: string;
  /** abbrevTreeHash 树对象的简短哈希字串 */
  t?: string;
  /** parentHashes 父对象（parent）的完整哈希字串 */
  P?: string;
  /** abbrevParentHashes 父对象的简短哈希字串 */
  p?: string;
  /** authorName 作者（author）的名字 */
  an?: string;
  /** authorEmail 作者的电子邮件地址 */
  ae?: string;
  /** authorDate 作者修订日期 */
  ad?: string;
  /** authorDateRel 作者修订日期，按多久以前的方式显示 */
  ar?: string;
  /** committerName 提交者(committer)的名字 */
  cn?: string;
  /** committerEmail 提交者的电子邮件地址 */
  ce?: string;
  /** committerDate 提交日期 */
  cd?: string;
  /** committerDateRel 提交日期，按多久以前的方式显示 */
  cr?: string;
  /** subject 提交说明 */
  s?: string;
}

/**
 * 获取近 N 条日志的详细信息
 * @param num 指定获取日志的数量
 * @param cwd 工作目录
 * @param filepath 指定获取日志的文件路径，可选
 */
export function getGitLog(num = 1, cwd?: string, filepath?: string) {
  num = Math.max(1, +num || 1);
  const prettyFormat = ['H', 'h', 'T', 't', 'p', 'P', 'cd', 'ad', 'an', 'ae', 'ce', 's', 'ar', 'cr'];
  const cmd = `git log -${num} --pretty="tformat:%${prettyFormat.join(' _-_ %')}" --date=iso ${filepath ? `-- ${filepath}` : ''}`.trim();
  const logResult = execSync(cmd, 'pipe', cwd);
  if (logResult.stderr) console.error('[getGitLog][error]', logResult.stderr);

  const list = logResult.stdout ? logResult.stdout.split('\n') : [];
  const result: GitLogItem[] = list.map(line => {
    const valList = line.split(' _-_ ');
    // eslint-disable-next-line unicorn/no-array-reduce
    return prettyFormat.reduce((r: GitLogItem, key: string, idx: number) => {
      r[key as never] = valList[idx] as never;
      return r;
    }, {});
  });

  return result;
}

/** 【git】获取当前的本地分支名 */
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

/** 【git】获取本地或远端最新的 commitId */
export function getHeadCommitId(isRemote = false, cwd = process.cwd()) {
  return isGitRepo(cwd) ? execSync(`git rev-parse ${isRemote ? '@{upstream}' : 'HEAD'}`, 'pipe', cwd).stdout : '';
}

/** 【git】获取本地或远端最新的 short commitId */
export function gitHashShort(length = 7, isRemote = false, cwd = process.cwd()) {
  return getHeadCommitId(isRemote, cwd).slice(0, length || 7);
}

/**
 * 【git】获取指定 HEAD 的变更文件列表
 * @param headIndex HEAD 顺序，默认为 0，即最新的本地未提交变更
 */
export function getHeadDiffFileList(headIndex = 0, cwd?: string, debug = false) {
  return execSync(`git diff HEAD~${headIndex} --name-only`, 'pipe', cwd, debug).stdout.split('\n').filter(Boolean);
}

/** 【git】获取 git user eamil 地址 */
export function getUserEmail() {
  return execSync('git config --get user.email', 'pipe').stdout;
}

/** 【git】给文件增加或撤销可执行权限 */
export function gitSetChmod(filepath: string, type: 'add' | 'del' = 'add') {
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

/**
 * 【git】是否存在未暂存的变更
 * @param dir 指定具体的文件或目录路径。默认为当前目录
 * @param cwd 工作目录
 */
export function gitHasUnstagedChanges(dir = '.', cwd = process.cwd()) {
  return execSync(`git status --short "${dir}"`, 'pipe', cwd).stdout.length > 0;
}

/** 获取 git 远程仓库地址 */
export function gitRemoteUrl(cwd = process.cwd()) {
  return execSync(`git ls-remote --get-url`, 'pipe', cwd).stdout;
}

/** 【git】是否存在未提交的变更 */
export function gitIsDirty(cwd = process.cwd()) {
  return execSync(`git diff-index HEAD --name-only`, 'pipe', cwd).stdout.length > 0;
}

/** 【git】最近一次的 tag 是否已过期（tag 之后存在新的提交） */
export function gitIsTagDirty(cwd = process.cwd()) {
  const r = execSync(`git describe --exact-match --tags`, 'pipe', cwd);

  if (r.stderr.includes('no tag exactly matches')) return true;
  if (r.stderr.includes('No names found')) return true;
  if (r.error) throw r.error;
  return false;
}

/** 【git】获取最近一次的修改日期 */
export function gitDate(cwd = process.cwd(), filepath?: string) {
  return new Date(getGitLog(1, cwd, filepath)[0].ad!);
}

/** 【git】获取最近一次的修改提交信息 */
export function gitMessage(cwd = process.cwd(), filepath?: string) {
  return getGitLog(1, cwd, filepath)[0]?.s;
}

/** 【git】获取历史提交总次数 */
export function gitCount(cwd = process.cwd()) {
  return +execSync(`git rev-list --all --count`, 'pipe', cwd).stdout;
}

/**
 * 【git】获取 .git 目录的绝对路径
 * @param cwd 工作目录。默认为当前目录
 */
export function gitDir(cwd = process.cwd()) {
  return resolve(execSync(`git rev-parse --absolute-git-dir`, 'pipe', cwd).stdout);
}

/**
 * 【git】获取 git 项目根目录绝对路径
 * @param cwd 工作目录。默认为当前目录
 */
export function gitGetTopDir(cwd = process.cwd()) {
  return resolve(execSync(`git rev-parse --show-toplevel`, 'pipe', cwd).stdout, cwd);
}

/** 【git】获取最新的 git tag */
export function gitGetTag(firstParent = false, cwd = process.cwd()) {
  // return gitGetAllTags()[0];
  return execSync(`git describe --always --tag --abbrev=0 ${firstParent ? '--first-parent' : ''}`, 'pipe', cwd).stdout;
}

/** 【git】获取全部的 tags 列表 */
export function gitGetAllTags(cwd = process.cwd()) {
  return execSync(`git tag --list`, 'pipe', cwd).stdout.split('\n').reverse().filter(Boolean);
}
