import { UnsubscribeFn } from "./unsubscribe";
import Emitter from "./emitter";
import { mergeDeep } from "./common";

export interface ListenerHandle<T> {
    callback: ListenerFn<T>;
    scope: object;
}

/*
    Value system with reactive subscriptions

    Value<T> - read-only reactive value
    ValueStore<T> - read-write reactive value
    ValueObserver<K, T> - derived reactive value from another Value<T> with transformation function
    ValueLogicObserver<T1, T2> - derived reactive boolean value from two Value<T> with logical operation

    Example usage:

    new ValueStore<string>("initial value");
    .set("new value");
    .get() => "new value"
    .subscribe((value, prev) => { ... });

    .format((value) => `Formatted: ${value}`) => Value<string>
    .equal("test") => Value<boolean>
    .notEqual("test") => Value<boolean>
    .mapBoolean(trueValue, falseValue) => Value<trueValue | falseValue>
    .not() => Value<boolean>
    .and(otherValue) => Value<boolean>
    .or(otherValue) => Value<boolean>
*/

export type ListenerFn<T> = (value: T, prev: T | undefined) => void;

export type ValueTypes = undefined | string | number | symbol | boolean | object | Array<unknown> | unknown;

export type ValueFormatterFn<T> = (value: T) => string;

export interface ValueReaderEvents {
    afterUnsubscribe: undefined;
}

export abstract class Value<T, E extends ValueReaderEvents = ValueReaderEvents> extends Emitter<E> {
    abstract get(): T;
    abstract subscribe(callback: ListenerFn<T>, scope?: object): UnsubscribeFn;

    equal(test: ((value: T | undefined) => boolean) | string | boolean | number): Value<boolean> {
        let transform: (value: T | undefined) => boolean;

        if (test instanceof Function) {
            transform = test as unknown as (value: T | undefined) => boolean;
        } else {
            transform = (v) => v === test;
        }

        const transformer = new ValueObserver<boolean, T>(this, transform);
        transformer.on("afterUnsubscribe", () => {
            if (transformer.subscribersLength === 0) {
                transformer.dispose();
            }
        });

        return transformer;
    }

    notEqual(test: (value: T | undefined) => boolean | string): Value<boolean> {
        let transform: (value: T | undefined) => boolean;

        if (typeof test === "string") {
            transform = (v) => v !== test;
        } else {
            transform = (value) => !(test as unknown as (value: T | undefined) => boolean)(value);
        }

        const transformer = new ValueObserver<boolean, T>(this, transform);
        transformer.on("afterUnsubscribe", () => {
            if (transformer.subscribersLength === 0) {
                transformer.dispose();
            }
        });

        return transformer;
    }

    format(formatter: ValueObserverTransform): Value<string> {
        const transformer = new ValueObserver<string, T>(this, formatter);
        transformer.on("afterUnsubscribe", () => {
            if (transformer.subscribersLength === 0) {
                transformer.dispose();
            }
        });

        return transformer;
    }

    mapBoolean<U>(trueValue: U, falseValue: U): Value<U> {
        const transformer = new ValueObserver<U, T>(this, (value) => {
            if (value === true) {
                return trueValue;
            } else if (value === false) {
                return falseValue;
            } else {
                return undefined as unknown as U;
            }
        });

        transformer.on("afterUnsubscribe", () => {
            if (transformer.subscribersLength === 0) {
                transformer.dispose();
            }
        });

        return transformer;
    }

    not(): Value<boolean> {
        const transformer = new ValueObserver<boolean, T>(this, (value) => !value);
        transformer.on("afterUnsubscribe", () => {
            if (transformer.subscribersLength === 0) {
                transformer.dispose();
            }
        });

        return transformer;
    }

    and<U>(other: Value<U>): Value<boolean> {
        const transformer = new ValueLogicObserver<T, U>(this, other, (a, b) => !!a && !!b);
        transformer.on("afterUnsubscribe", () => {
            if (transformer.subscribersLength === 0) {
                transformer.dispose();
            }
        });

        return transformer;
    }

    or<U extends ValueTypes>(other: Value<U>): Value<boolean> {
        const transformer = new ValueLogicObserver<T, U>(this, other, (a, b) => !!a || !!b);
        transformer.on("afterUnsubscribe", () => {
            if (transformer.subscribersLength === 0) {
                transformer.dispose();
            }
        });

        return transformer;
    }
}

export function isValue<T>(object: unknown): object is Value<T, ValueReaderEvents> {
    return object instanceof Value;
}

export type ValueEvents = ValueReaderEvents;

export class ValueStore<T extends ValueTypes, E extends ValueEvents = ValueEvents> extends Value<T, E> {
    private listeners: ListenerHandle<T>[] = [];
    private value: T;
    private initValue: T;
    private prev: T | undefined;

    constructor(value: T) {
        super();

        this.value = value;
        this.initValue = value;
        this.prev = undefined;
    }

    override dispose(): void {
        if (this.disposed) return;

        this.listeners.splice(0, this.listeners.length);

        super.dispose();
    }

    subscribe(callback: ListenerFn<T>, scope: object = this): UnsubscribeFn {
        const handle: ListenerHandle<T> = {
            callback,
            scope
        };

        this.listeners.push(handle);

        this.deliveryValueToSubscriber(handle, this.value, this.prev);

        return () => {
            this.listeners.splice(this.listeners.indexOf(handle), 1);
            this.emit("afterUnsubscribe", this as unknown as E["afterUnsubscribe"]);
        };
    }

    set(value: ((value: T, initValue: T) => T) | T extends object ? Record<string, unknown> : T): void {
        const newValue = typeof value === "function" ? value(this.get(), this.initValue) : value;
        this.prev = this.get();

        if (this.value !== newValue) {
            if (Array.isArray(this.value)) {
                this.value = [...newValue] as T;
            } else if (typeof this.value === "object") {
                // this.value = { ...(this.value as object), ...newValue };
                this.value = mergeDeep(this.value as Record<string, unknown>, newValue) as T;
            } else {
                this.value = newValue;
            }

            this.deliveryValue(this.value, this.prev);
        }
    }

    reinitAndSet(value: T extends object ? Record<string, unknown> : T): void {
        if (typeof value === "object") {
            this.set({ ...(this.initValue as object), ...value });
        } else {
            this.set(value);
        }
    }

    get(): T {
        if (Array.isArray(this.value)) {
            return [...this.value] as T;
        } else if (typeof this.value === "object") {
            return mergeDeep({}, this.value as Record<string, unknown>) as T;
        }

        return this.value;
    }

    override toString(): string {
        return this.value === undefined || this.value === null ? "undefined" : this.value.toString();
    }

    protected deliveryValue(value: T, prev: T | undefined): void {
        for (const handle of this.listeners) {
            this.deliveryValueToSubscriber(handle, value, prev);
        }
    }

    private deliveryValueToSubscriber(handle: ListenerHandle<T>, value: T, prev: T | undefined): void {
        handle.callback.call(handle.scope, value, prev);
    }
}

export type ValueObserverTransform = <T extends ValueTypes, K>(value: T) => K;

export class ValueObserver<K, T extends ValueTypes> extends Value<K> {
    private listeners: ListenerHandle<K>[] = [];
    private readonly watch: Value<T>;
    private prev: K | undefined;
    private value: K;
    private transform: (value: T | undefined) => K;

    constructor(watch: Value<T>, transform: (value: T | undefined) => K) {
        super();

        this.watch = watch;

        this.transform = transform;
        this.value = this.transform(this.watch.get());

        this.register(
            this.watch.subscribe((value) => {
                const newValue = this.transform(value);

                if (this.value !== newValue) {
                    this.prev = this.value;
                    this.value = newValue;
                    this.deliverValue(this.value, this.prev);
                }
            })
        );
    }

    subscribe(callback: ListenerFn<K>, scope: object = this): UnsubscribeFn {
        const handle: ListenerHandle<K> = {
            callback,
            scope
        };

        this.listeners.push(handle);

        this.deliverValueToSubscriber(handle, this.value, this.prev);

        return () => {
            this.listeners.splice(this.listeners.indexOf(handle), 1);
            this.emit("afterUnsubscribe", undefined);
        };
    }

    get(): K {
        return this.value;
    }

    override toString(): string {
        return this.watch.toString();
    }

    get subscribersLength(): number {
        return this.listeners.length;
    }

    protected deliverValue(value: K, prev: K | undefined): void {
        for (const handle of this.listeners) {
            this.deliverValueToSubscriber(handle, value, prev);
        }
    }

    private deliverValueToSubscriber(handle: ListenerHandle<K>, value: K, prev: K | undefined): void {
        handle.callback.call(handle.scope, value, prev);
    }
}

export class ValueLogicObserver<T1 extends ValueTypes, T2 extends ValueTypes> extends Value<boolean> {
    private listeners: ListenerHandle<boolean>[] = [];
    private readonly watch1: Value<T1>;
    private readonly watch2: Value<T2>;
    private prev: boolean | undefined;
    private value: boolean;
    private transform: (value1: T1, value2: T2) => boolean;

    constructor(watch1: Value<T1>, watch2: Value<T2>, transform: (value1: T1, value2: T2) => boolean) {
        super();

        this.watch1 = watch1;
        this.watch2 = watch2;

        this.transform = transform;
        this.value = this.transform(this.watch1.get(), this.watch2.get());

        this.register(
            this.watch1.subscribe((value) => {
                const newValue = this.transform(value, this.watch2.get());

                if (this.value !== newValue) {
                    this.prev = this.value;
                    this.value = newValue;
                    this.deliverValue(this.value, this.prev);
                }
            })
        );

        this.register(
            this.watch2.subscribe((value) => {
                const newValue = this.transform(this.watch1.get(), value);

                if (this.value !== newValue) {
                    this.prev = this.value;
                    this.value = newValue;
                    this.deliverValue(this.value, this.prev);
                }
            })
        );
    }

    subscribe(callback: ListenerFn<boolean>, scope: object = this): UnsubscribeFn {
        const handle: ListenerHandle<boolean> = {
            callback,
            scope
        };

        this.listeners.push(handle);

        this.deliverValueToSubscriber(handle, this.value, this.prev);

        return () => {
            this.listeners.splice(this.listeners.indexOf(handle), 1);
            this.emit("afterUnsubscribe", undefined);
        };
    }

    get(): boolean {
        return this.value;
    }

    override toString(): string {
        return this.watch1.toString() + this.watch2.toString();
    }

    get subscribersLength(): number {
        return this.listeners.length;
    }

    protected deliverValue(value: boolean, prev: boolean | undefined): void {
        for (const handle of this.listeners) {
            this.deliverValueToSubscriber(handle, value, prev);
        }
    }

    private deliverValueToSubscriber(handle: ListenerHandle<boolean>, value: boolean, prev: boolean | undefined): void {
        handle.callback.call(handle.scope, value, prev);
    }

    override dispose(): void {
        if (this.disposed) return;

        this.listeners.splice(0, this.listeners.length);

        super.dispose();
    }
}
