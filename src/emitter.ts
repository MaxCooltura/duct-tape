import { Disposable, DisposeFn } from './disposable';

export interface EmitterHandle<T> {
  callback: EmitterCallbackFn<T>;
  scope: object;
  once: boolean;
}

export type EmitterCallbackFn<T> = (event: T) => void;

export class Emitter<T> extends Disposable {
  protected _emitterHandles: {
    [K in keyof T]?: EmitterHandle<T[K]>[];
  };

  constructor() {
    super();

    this._emitterHandles = {};
  }

  override dispose(): void {
    if (this.disposed) return;

    this._emitterHandles = {};

    super.dispose();
  }

  on<K extends keyof T>(
    name: K,
    callback: EmitterCallbackFn<T[K]>,
    scope: object = this,
  ): DisposeFn {
    this._addCallback(name, callback, scope, false);

    return () => this.off(name, callback, scope);
  }

  once<K extends keyof T>(
    name: K,
    callback: EmitterCallbackFn<T[K]>,
    scope: object = this,
  ): DisposeFn {
    this._addCallback(name, callback, scope, true);

    return () => this.off(name, callback, scope);
  }

  off<K extends keyof T>(
    name: K,
    callback: EmitterCallbackFn<T[K]>,
    scope: object = this,
  ): void {
    const handlesByName = this._emitterHandles[name];

    if (handlesByName) {
      let i = handlesByName.length;

      while (--i >= 0) {
        if (
          handlesByName[i].callback === callback &&
          handlesByName[i].scope === scope
        ) {
          handlesByName.splice(i, 1);
        }
      }
    }
  }

  emit<K extends keyof T>(name: K, value: T[K]): void {
    const handlesByName = this._emitterHandles[name];
    if (!handlesByName) {
      return;
    }

    for (const handle of handlesByName) {
      handle.callback.call(handle.scope, value);

      if (handle.once) this.off(name, handle.callback, handle.scope);
    }
  }

  private _addCallback<K extends keyof T>(
    name: K,
    callback: EmitterCallbackFn<T[K]>,
    scope: object,
    once: boolean,
  ) {
    let handlesByName = this._emitterHandles[name];

    if (!handlesByName) {
      handlesByName = this._emitterHandles[name] = [];
    }

    handlesByName.push({
      callback,
      scope,
      once,
    });
  }
}

export default Emitter;
