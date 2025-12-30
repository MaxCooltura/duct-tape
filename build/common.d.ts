export declare function isObject(value: unknown): value is object;
export declare function isFunction(value: unknown): value is () => boolean;
export declare function isDefined(value: unknown): boolean;
export declare function hasOwnProperty(value: unknown, name: string): boolean;
export declare function hasOwnFunction(value: unknown, name: string): boolean;
export declare function isEmpty(value: unknown): boolean;
export declare function isTrue(value: unknown): boolean;
export declare function isFalse(value: unknown): boolean;
export declare function mergeDeep(target: Record<string, unknown>, ...sources: Record<string, unknown>[]): Record<string, unknown>;
