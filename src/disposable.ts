import { hasOwnFunction, isFunction, isObject } from "./common";

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

export abstract class Disposable implements IDisposable {
    protected _disposed: boolean;
    private _disposables: Map<object, DisposeFn> = new Map();

    protected constructor() {
        this._disposed = false;
    }

    dispose(): void {
        if (this._disposed) return;

        try {
            const disposables = Array.from(this._disposables.entries()).reverse();

            for (const [, fn] of disposables) {
                try {
                    fn();
                } catch (e) {
                    console.error(e);
                }
            }

            this._disposables.clear();
        } finally {
            this._disposed = true;
        }
    }

    get disposed(): boolean {
        return this._disposed;
    }

    register<T extends IDisposable | IDestroyable | IRemovable | DisposeFn>(o: T): T {
        if (this._disposables.has(o)) {
            console.warn(`Cannot register ${o?.constructor?.name ?? o}. This object is already registered.`);
            return o;
        }

        if (isObject(o)) {
            if (hasOwnFunction(o, "dispose")) {
                this._disposables.set(o, () => (o as IDisposable).dispose());
            } else if (hasOwnFunction(o, "destroy")) {
                this._disposables.set(o, () => (o as IDestroyable).destroy());
            } else if (hasOwnFunction(o, "remove")) {
                this._disposables.set(o, () => (o as IRemovable).remove());
            } else {
                console.warn(`The object ${o?.constructor?.name ?? o} has an unknown release function!`);
            }
        } else if (isFunction(o)) {
            this._disposables.set(o, o);
        } else {
            console.warn(`Cannot register ${o}. This object does not have a release function!`);
        }

        return o;
    }

    unregister<T extends IDisposable | IDestroyable | IRemovable | DisposeFn | EventListenerOrEventListenerObject>(
        o: T
    ): void {
        if (this._disposables.has(o)) {
            this._disposables.delete(o);
        } else {
            console.warn("Object ${o} doesn't exist in register.");
        }
    }
}
