export interface IDisposable {
    dispose(): void;
}
export interface IDestroyable {
    destroy(): void;
}
export interface IRemovable {
    remove(): void;
}
export type DisposeFn = () => void;
export declare function createDisposeFn(fn: DisposeFn): DisposeFn;
export declare abstract class Disposable implements IDisposable {
    protected _disposed: boolean;
    private _disposables;
    protected constructor();
    dispose(): void;
    get disposed(): boolean;
    register<T extends IDisposable | IDestroyable | IRemovable | DisposeFn>(o: T): T;
    unregister<T extends IDisposable | IDestroyable | IRemovable | DisposeFn | EventListenerOrEventListenerObject>(o: T): void;
}
export declare class DummyDisposable extends Disposable {
    constructor();
}
