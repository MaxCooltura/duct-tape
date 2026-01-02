import { hasOwnFunction, isFunction, isObject } from "./common";
export function createDisposeFn(fn) {
    return fn;
}
export class Disposable {
    _disposed;
    _disposables = new Map();
    constructor() {
        this._disposed = false;
    }
    dispose() {
        if (this._disposed)
            return;
        try {
            const disposables = Array.from(this._disposables.entries()).reverse();
            for (const [, fn] of disposables) {
                try {
                    fn();
                }
                catch (e) {
                    console.error(e);
                }
            }
            this._disposables.clear();
        }
        finally {
            this._disposed = true;
        }
    }
    get disposed() {
        return this._disposed;
    }
    register(o) {
        if (this._disposables.has(o)) {
            console.warn(`Cannot register ${o?.constructor?.name ?? o}. This object is already registered.`);
            return o;
        }
        if (isObject(o)) {
            if (hasOwnFunction(o, "dispose")) {
                this._disposables.set(o, () => o.dispose());
            }
            else if (hasOwnFunction(o, "destroy")) {
                this._disposables.set(o, () => o.destroy());
            }
            else if (hasOwnFunction(o, "remove")) {
                this._disposables.set(o, () => o.remove());
            }
            else {
                console.warn(`The object ${o?.constructor?.name ?? o} has an unknown release function!`);
            }
        }
        else if (isFunction(o)) {
            this._disposables.set(o, o);
        }
        else {
            console.warn(`Cannot register ${o}. This object does not have a release function!`);
        }
        return o;
    }
    unregister(o) {
        if (this._disposables.has(o)) {
            this._disposables.delete(o);
        }
        else {
            console.warn("Object ${o} doesn't exist in register.");
        }
    }
}
export class DummyDisposable extends Disposable {
    constructor() {
        super();
    }
}
//# sourceMappingURL=disposable.js.map