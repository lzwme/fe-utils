/* eslint-disable @typescript-eslint/no-explicit-any */
// 主要定义一些 types 工具方法或类型

/** 获取 T 的 value 值类型 */
export type ValueOf<T> = T[keyof T];

/** 获取 Record 类型的 value 值类型。对于 Record 效果等同 ValueOf */
export type RecordValueType<T> = T extends Record<any, infer U> ? U : T;

export type ThenArgs<T> = T extends PromiseLike<infer U> ? U : T;

export type ArrayLikeArgs<T> = T extends ArrayLike<infer U> ? U : T;

export type GeneralFn<T = void> = (...p: unknown[]) => T;

/**
 * @deprecated This type should be avoided as far as possible
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObject = Record<string, any>;

export type ComputeRange<N extends number, Result extends Array<unknown> = []> = Result['length'] extends N
  ? Result
  : ComputeRange<N, [...Result, Result['length']]>;

type Octal256 = ComputeRange<256>[number]; // 0 - 255
type AlphaChanel = `0.${ComputeRange<999>[number]}` | '1.0';
type AssertAlpha<Alpha extends number> = `${Alpha}` extends AlphaChanel ? Alpha : never;
export type RGBA<Alpha extends number = 1> = [Octal256, Octal256, Octal256, AssertAlpha<Alpha>?];
