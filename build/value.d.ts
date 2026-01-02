import { UnsubscribeFn } from "./unsubscribe";
import { Disposable } from "./disposable";
export interface ListenerHandle<T> {
    callback: ListenerFn<T>;
    scope: object;
}
export type ListenerFn<T> = (value: T, prev: T | undefined) => void;
export type ValueTypes = undefined | string | number | symbol | boolean | object | Array<unknown> | unknown;
export type ValueFormatterFn<T> = (value: T) => string;
export declare function createValue<T>(value: T, register?: Disposable): ValueStore<T>;
export declare abstract class Value<T> extends Disposable {
    abstract get(): T;
    abstract subscribe(callback: ListenerFn<T>, scope?: object): UnsubscribeFn;
    equal(test: ((value: T | undefined) => boolean) | string | boolean | number, register?: Disposable): Value<boolean>;
    notEqual(test: (value: T | undefined) => boolean | string, register?: Disposable): Value<boolean>;
    format(formatter: ValueObserverTransform<T, string>, register?: Disposable): Value<string>;
    map<U>(transformerFn: ValueObserverTransform<T, U>, register?: Disposable): Value<U>;
    mapBoolean<U>(trueValue: U, falseValue: U, register?: Disposable): Value<U>;
    not(register?: Disposable): Value<boolean>;
    and<U>(other: Value<U>, register?: Disposable): Value<boolean>;
    or<U extends ValueTypes>(other: Value<U>, register?: Disposable): Value<boolean>;
}
export declare function isValue<T>(object: unknown): object is Value<T>;
export declare class ValueStore<T extends ValueTypes> extends Value<T> {
    private listeners;
    private value;
    private initValue;
    private prev;
    private _register?;
    constructor(value: T, register?: Disposable);
    dispose(): void;
    subscribe(callback: ListenerFn<T>, scope?: object): UnsubscribeFn;
    set(value: T): void;
    get(): T;
    toString(): string;
    protected deliveryValue(value: T, prev: T | undefined): void;
    private deliveryValueToSubscriber;
}
export type ValueObserverTransform<T extends ValueTypes, K> = (value: T) => K;
export declare class ValueObserver<K, T extends ValueTypes> extends Value<K> {
    private listeners;
    private watch?;
    private prev;
    private value;
    private _transform;
    private _unsubscribe;
    constructor(watch: Value<T>, transform: (value: T) => K);
    dispose(): void;
    subscribe(callback: ListenerFn<K>, scope?: object): UnsubscribeFn;
    get(): K;
    toString(): string;
    get subscribersLength(): number;
    protected deliverValue(value: K, prev: K | undefined): void;
    private deliverValueToSubscriber;
}
export declare class ValueLogicObserver<T1 extends ValueTypes, T2 extends ValueTypes> extends Value<boolean> {
    private listeners;
    private watch1?;
    private watch2?;
    private prev;
    private value;
    private transform;
    constructor(watch1: Value<T1>, watch2: Value<T2>, transform: (value1: T1, value2: T2) => boolean);
    dispose(): void;
    subscribe(callback: ListenerFn<boolean>, scope?: object): UnsubscribeFn;
    get(): boolean;
    toString(): string;
    get subscribersLength(): number;
    protected deliverValue(value: boolean, prev: boolean | undefined): void;
    private deliverValueToSubscriber;
}
