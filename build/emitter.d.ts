import { Disposable, DisposeFn } from "./disposable";
export interface EmitterHandle<T> {
    callback: EmitterCallbackFn<T>;
    scope: object;
    once: boolean;
}
export type EmitterCallbackFn<T> = (event: T) => void;
export declare class Emitter<T> extends Disposable {
    protected _emitterHandles: {
        [K in keyof T]?: EmitterHandle<T[K]>[];
    };
    constructor();
    dispose(): void;
    on<K extends keyof T>(name: K, callback: EmitterCallbackFn<T[K]>, scope?: object): DisposeFn;
    once<K extends keyof T>(name: K, callback: EmitterCallbackFn<T[K]>, scope?: object): DisposeFn;
    off<K extends keyof T>(name: K, callback: EmitterCallbackFn<T[K]>, scope?: object): void;
    emit<K extends keyof T>(name: K, value: T[K]): void;
    private _addCallback;
}
export default Emitter;
