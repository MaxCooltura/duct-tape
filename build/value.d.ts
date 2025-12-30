import { UnsubscribeFn } from "./unsubscribe";
import Emitter from "./emitter";
export interface ListenerHandle<T> {
    callback: ListenerFn<T>;
    scope: object;
}
export type ListenerFn<T> = (value: T, prev: T | undefined) => void;
export type ValueTypes = undefined | string | number | symbol | boolean | object | Array<unknown> | unknown;
export type ValueFormatterFn<T> = (value: T) => string;
export interface ValueReaderEvents {
    afterUnsubscribe: undefined;
}
export declare abstract class Value<T, E extends ValueReaderEvents = ValueReaderEvents> extends Emitter<E> {
    abstract get(): T;
    abstract subscribe(callback: ListenerFn<T>, scope?: object): UnsubscribeFn;
    equal(test: ((value: T | undefined) => boolean) | string | boolean | number): Value<boolean>;
    notEqual(test: (value: T | undefined) => boolean | string): Value<boolean>;
    format(formatter: ValueObserverTransform): Value<string>;
    mapBoolean<U>(trueValue: U, falseValue: U): Value<U>;
    not(): Value<boolean>;
    and<U>(other: Value<U>): Value<boolean>;
    or<U extends ValueTypes>(other: Value<U>): Value<boolean>;
}
export declare function isValue<T>(object: unknown): object is Value<T, ValueReaderEvents>;
export type ValueEvents = ValueReaderEvents;
export declare class ValueStore<T extends ValueTypes, E extends ValueEvents = ValueEvents> extends Value<T, E> {
    private listeners;
    private value;
    private initValue;
    private prev;
    constructor(value: T);
    dispose(): void;
    subscribe(callback: ListenerFn<T>, scope?: object): UnsubscribeFn;
    set(value: ((value: T, initValue: T) => T) | T extends object ? Record<string, unknown> : T): void;
    reinitAndSet(value: T extends object ? Record<string, unknown> : T): void;
    get(): T;
    toString(): string;
    protected deliveryValue(value: T, prev: T | undefined): void;
    private deliveryValueToSubscriber;
}
export type ValueObserverTransform = <T extends ValueTypes, K>(value: T) => K;
export declare class ValueObserver<K, T extends ValueTypes> extends Value<K> {
    private listeners;
    private readonly watch;
    private prev;
    private value;
    private transform;
    constructor(watch: Value<T>, transform: (value: T | undefined) => K);
    subscribe(callback: ListenerFn<K>, scope?: object): UnsubscribeFn;
    get(): K;
    toString(): string;
    get subscribersLength(): number;
    protected deliverValue(value: K, prev: K | undefined): void;
    private deliverValueToSubscriber;
}
export declare class ValueLogicObserver<T1 extends ValueTypes, T2 extends ValueTypes> extends Value<boolean> {
    private listeners;
    private readonly watch1;
    private readonly watch2;
    private prev;
    private value;
    private transform;
    constructor(watch1: Value<T1>, watch2: Value<T2>, transform: (value1: T1, value2: T2) => boolean);
    subscribe(callback: ListenerFn<boolean>, scope?: object): UnsubscribeFn;
    get(): boolean;
    toString(): string;
    get subscribersLength(): number;
    protected deliverValue(value: boolean, prev: boolean | undefined): void;
    private deliverValueToSubscriber;
    dispose(): void;
}
