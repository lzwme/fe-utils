/* eslint-disable @typescript-eslint/no-explicit-any */
// 主要定义一些 types 工具方法或类型

/** 获取 T 的 value 值类型 */
export type ValueOf<T> = T[keyof T];

/** 获取 Record 类型的 value 值类型。对于 Record 效果等同 ValueOf */
export type RecordValueType<T> = T extends Record<any, infer U> ? U : T;

export type ThenArgs<T> = T extends PromiseLike<infer U> ? U : T;

export type ArrayLikeArgs<T> = T extends ArrayLike<infer U> ? U : T;

export type GeneralFn<T = void> = (...p: unknown[]) => T;
