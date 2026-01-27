import { mergeDeep } from './common';
import { Disposable } from './disposable';
import { toBoolean } from './to';
import { UnsubscribeFn } from './unsubscribe';

export interface ListenerHandle<T> {
  callback: ListenerFn<T>;
  scope: object;
}

export type ListenerFn<T> = (value: T, prev: T | undefined) => void;

export type ValueTypes =
  | undefined
  | string
  | number
  | symbol
  | boolean
  | object
  | Array<unknown>
  | unknown;

export type ValueFormatterFn<T> = (value: T) => string;

export function createValue<T>(value: T, register?: Disposable): ValueStore<T> {
  return new ValueStore<T>(value, register);
}

export abstract class Value<T> extends Disposable {
  abstract get(): T;
  abstract subscribe(callback: ListenerFn<T>, scope?: object): UnsubscribeFn;

  equal(
    test: ((value: T | undefined) => boolean) | string | boolean | number,
    register?: Disposable,
  ): Value<boolean> {
    let transform: (value: T | undefined) => boolean;

    if (test instanceof Function) {
      transform = test as unknown as (value: T | undefined) => boolean;
    } else {
      transform = (v) => v === test;
    }

    const transformer = new ValueObserver<boolean, T>(this, transform);

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }

  notEqual(
    test: (value: T | undefined) => boolean | string,
    register?: Disposable,
  ): Value<boolean> {
    let transform: (value: T | undefined) => boolean;

    if (typeof test === 'string') {
      transform = (v) => v !== test;
    } else {
      transform = (value) =>
        !(test as unknown as (value: T | undefined) => boolean)(value);
    }

    const transformer = new ValueObserver<boolean, T>(this, transform);

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }

  format(
    formatter: ValueObserverTransform<T, string>,
    register?: Disposable,
  ): Value<string> {
    const transformer = new ValueObserver<string, T>(this, formatter);

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }

  map<U>(
    transformerFn: ValueObserverTransform<T, U>,
    register?: Disposable,
  ): Value<U> {
    const transformer = new ValueObserver<U, T>(this, transformerFn);

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }

  mapBoolean<U>(trueValue: U, falseValue: U, register?: Disposable): Value<U> {
    const transformer = new ValueObserver<U, T>(this, (value) => {
      if (toBoolean(value) === true) {
        return trueValue;
      } else {
        return falseValue;
      }
    });

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }

  not(register?: Disposable): Value<boolean> {
    const transformer = new ValueObserver<boolean, T>(
      this,
      (value) => !toBoolean(value),
    );

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }

  and<U>(other: Value<U>, register?: Disposable): Value<boolean> {
    const transformer = new ValueLogicObserver<T, U>(
      this,
      other,
      (a, b) => toBoolean(a) && toBoolean(b),
    );

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }

  or<U extends ValueTypes>(
    other: Value<U>,
    register?: Disposable,
  ): Value<boolean> {
    const transformer = new ValueLogicObserver<T, U>(
      this,
      other,
      (a, b) => toBoolean(a) || toBoolean(b),
    );

    if (register) {
      register.register(transformer);
    }

    return transformer;
  }
}

export function isValue<T>(object: unknown): object is Value<T> {
  return object instanceof Value;
}

export class ValueStore<T extends ValueTypes> extends Value<T> {
  private listeners: ListenerHandle<T>[] = [];
  private value: T;
  private initValue: T;
  private prev: T | undefined;
  private _register?: Disposable;

  constructor(value: T, register?: Disposable) {
    super();

    this._register = register;
    this.value = value;
    this.initValue = value;
    this.prev = undefined;

    if (register) {
      register.register(this);
    }
  }

  override dispose(): void {
    if (this.disposed) return;

    this.listeners.splice(0, this.listeners.length);

    if (this._register) {
      this._register.unregister(this);
      this._register = undefined;
    }

    super.dispose();
  }

  subscribe(callback: ListenerFn<T>, scope: object = this): UnsubscribeFn {
    const handle: ListenerHandle<T> = {
      callback,
      scope,
    };

    this.listeners.push(handle);

    this.deliveryValueToSubscriber(handle, this.value, this.prev);

    return () => {
      this.listeners.splice(this.listeners.indexOf(handle), 1);
    };
  }

  set(value: T): void {
    this.prev = this.get();

    if (
      this.value !== value &&
      value !== undefined &&
      value !== null &&
      typeof value === typeof this.value
    ) {
      if (Array.isArray(this.value)) {
        this.value = [...(value as unknown as any[])] as T;
      } else if (typeof this.value === 'object') {
        this.value = mergeDeep(
          this.value as Record<string, unknown>,
          value as Record<string, unknown>,
        ) as T;
      } else {
        this.value = value;
      }

      this.deliveryValue(this.value, this.prev);
    }
  }

  get(): T {
    if (Array.isArray(this.value)) {
      return [...this.value] as T;
    } else if (typeof this.value === 'object') {
      return mergeDeep({}, this.value as Record<string, unknown>) as T;
    }

    return this.value;
  }

  override toString(): string {
    return this.value === undefined || this.value === null
      ? 'undefined'
      : this.value.toString();
  }

  protected deliveryValue(value: T, prev: T | undefined): void {
    for (const handle of this.listeners) {
      this.deliveryValueToSubscriber(handle, value, prev);
    }
  }

  private deliveryValueToSubscriber(
    handle: ListenerHandle<T>,
    value: T,
    prev: T | undefined,
  ): void {
    handle.callback.call(handle.scope, value, prev);
  }
}

export type ValueObserverTransform<T extends ValueTypes, K> = (value: T) => K;

export class ValueObserver<K, T extends ValueTypes> extends Value<K> {
  private listeners: ListenerHandle<K>[] = [];
  private watch?: Value<T>;
  private prev: K | undefined;
  private value: K;
  private _transform: (value: T) => K;
  private _unsubscribe: UnsubscribeFn | null = null;

  constructor(watch: Value<T>, transform: (value: T) => K) {
    super();

    this.watch = watch;

    this._transform = transform;
    this.value = this._transform(this.watch.get());

    this._unsubscribe = this.watch.subscribe((value) => {
      const newValue = this._transform(value);

      if (this.value !== newValue) {
        this.prev = this.value;
        this.value = newValue;
        this.deliverValue(this.value, this.prev);
      }
    });
  }

  override dispose(): void {
    if (this.disposed) return;

    this.watch = undefined;
    this._unsubscribe?.();
    this.listeners.splice(0, this.listeners.length);

    super.dispose();
  }

  subscribe(callback: ListenerFn<K>, scope: object = this): UnsubscribeFn {
    const handle: ListenerHandle<K> = {
      callback,
      scope,
    };

    this.listeners.push(handle);

    this.deliverValueToSubscriber(handle, this.value, this.prev);

    return () => {
      this.listeners.splice(this.listeners.indexOf(handle), 1);
    };
  }

  get(): K {
    return this.value;
  }

  override toString(): string {
    return this.watch?.toString() || '';
  }

  get subscribersLength(): number {
    return this.listeners.length;
  }

  protected deliverValue(value: K, prev: K | undefined): void {
    for (const handle of this.listeners) {
      this.deliverValueToSubscriber(handle, value, prev);
    }
  }

  private deliverValueToSubscriber(
    handle: ListenerHandle<K>,
    value: K,
    prev: K | undefined,
  ): void {
    handle.callback.call(handle.scope, value, prev);
  }
}

export class ValueLogicObserver<
  T1 extends ValueTypes,
  T2 extends ValueTypes,
> extends Value<boolean> {
  private listeners: ListenerHandle<boolean>[] = [];
  private watch1?: Value<T1>;
  private watch2?: Value<T2>;
  private prev: boolean | undefined;
  private value: boolean;
  private transform: (value1: T1, value2: T2) => boolean;

  constructor(
    watch1: Value<T1>,
    watch2: Value<T2>,
    transform: (value1: T1, value2: T2) => boolean,
  ) {
    super();

    this.watch1 = watch1;
    this.watch2 = watch2;

    this.transform = transform;
    this.value = this.transform(this.watch1.get(), this.watch2.get());

    watch1.subscribe((value) => {
      const newValue = this.transform(value, watch2.get());

      if (this.value !== newValue) {
        this.prev = this.value;
        this.value = newValue;
        this.deliverValue(this.value, this.prev);
      }
    });

    watch2.subscribe((value) => {
      const newValue = this.transform(watch1.get(), value);

      if (this.value !== newValue) {
        this.prev = this.value;
        this.value = newValue;
        this.deliverValue(this.value, this.prev);
      }
    });
  }

  override dispose(): void {
    if (this.disposed) return;

    this.watch1 = undefined;
    this.watch2 = undefined;
    this.listeners.splice(0, this.listeners.length);

    super.dispose();
  }

  subscribe(
    callback: ListenerFn<boolean>,
    scope: object = this,
  ): UnsubscribeFn {
    const handle: ListenerHandle<boolean> = {
      callback,
      scope,
    };

    this.listeners.push(handle);

    this.deliverValueToSubscriber(handle, this.value, this.prev);

    return () => {
      this.listeners.splice(this.listeners.indexOf(handle), 1);
    };
  }

  get(): boolean {
    return this.value;
  }

  override toString(): string {
    return `${this.watch1?.toString()} ${this.watch2?.toString()}`;
  }

  get subscribersLength(): number {
    return this.listeners.length;
  }

  protected deliverValue(value: boolean, prev: boolean | undefined): void {
    for (const handle of this.listeners) {
      this.deliverValueToSubscriber(handle, value, prev);
    }
  }

  private deliverValueToSubscriber(
    handle: ListenerHandle<boolean>,
    value: boolean,
    prev: boolean | undefined,
  ): void {
    handle.callback.call(handle.scope, value, prev);
  }
}
