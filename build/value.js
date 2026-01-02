import { mergeDeep } from "./common";
import { toBoolean } from "./to";
import { Disposable } from "./disposable";
export function createValue(value, register) {
    return new ValueStore(value, register);
}
export class Value extends Disposable {
    equal(test, register) {
        let transform;
        if (test instanceof Function) {
            transform = test;
        }
        else {
            transform = (v) => v === test;
        }
        const transformer = new ValueObserver(this, transform);
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
    notEqual(test, register) {
        let transform;
        if (typeof test === "string") {
            transform = (v) => v !== test;
        }
        else {
            transform = (value) => !test(value);
        }
        const transformer = new ValueObserver(this, transform);
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
    format(formatter, register) {
        const transformer = new ValueObserver(this, formatter);
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
    map(transformerFn, register) {
        const transformer = new ValueObserver(this, transformerFn);
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
    mapBoolean(trueValue, falseValue, register) {
        const transformer = new ValueObserver(this, (value) => {
            if (toBoolean(value) === true) {
                return trueValue;
            }
            else {
                return falseValue;
            }
        });
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
    not(register) {
        const transformer = new ValueObserver(this, (value) => !toBoolean(value));
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
    and(other, register) {
        const transformer = new ValueLogicObserver(this, other, (a, b) => toBoolean(a) && toBoolean(b));
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
    or(other, register) {
        const transformer = new ValueLogicObserver(this, other, (a, b) => toBoolean(a) || toBoolean(b));
        if (register) {
            register.register(transformer);
        }
        return transformer;
    }
}
export function isValue(object) {
    return object instanceof Value;
}
export class ValueStore extends Value {
    listeners = [];
    value;
    initValue;
    prev;
    _register;
    constructor(value, register) {
        super();
        this._register = register;
        this.value = value;
        this.initValue = value;
        this.prev = undefined;
        if (register) {
            register.register(this);
        }
    }
    dispose() {
        if (this.disposed)
            return;
        this.listeners.splice(0, this.listeners.length);
        if (this._register) {
            this._register.unregister(this);
            this._register = undefined;
        }
        super.dispose();
    }
    subscribe(callback, scope = this) {
        const handle = {
            callback,
            scope
        };
        this.listeners.push(handle);
        this.deliveryValueToSubscriber(handle, this.value, this.prev);
        return () => {
            this.listeners.splice(this.listeners.indexOf(handle), 1);
        };
    }
    set(value) {
        this.prev = this.get();
        if (this.value !== value && value !== undefined && value !== null && typeof value === typeof this.value) {
            if (Array.isArray(this.value)) {
                this.value = [...value];
            }
            else if (typeof this.value === "object") {
                this.value = mergeDeep(this.value, value);
            }
            else {
                this.value = value;
            }
            this.deliveryValue(this.value, this.prev);
        }
    }
    get() {
        if (Array.isArray(this.value)) {
            return [...this.value];
        }
        else if (typeof this.value === "object") {
            return mergeDeep({}, this.value);
        }
        return this.value;
    }
    toString() {
        return this.value === undefined || this.value === null ? "undefined" : this.value.toString();
    }
    deliveryValue(value, prev) {
        for (const handle of this.listeners) {
            this.deliveryValueToSubscriber(handle, value, prev);
        }
    }
    deliveryValueToSubscriber(handle, value, prev) {
        handle.callback.call(handle.scope, value, prev);
    }
}
export class ValueObserver extends Value {
    listeners = [];
    watch;
    prev;
    value;
    _transform;
    _unsubscribe = null;
    constructor(watch, transform) {
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
    dispose() {
        if (this.disposed)
            return;
        this.watch = undefined;
        this._unsubscribe?.();
        this.listeners.splice(0, this.listeners.length);
        super.dispose();
    }
    subscribe(callback, scope = this) {
        const handle = {
            callback,
            scope
        };
        this.listeners.push(handle);
        this.deliverValueToSubscriber(handle, this.value, this.prev);
        return () => {
            this.listeners.splice(this.listeners.indexOf(handle), 1);
        };
    }
    get() {
        return this.value;
    }
    toString() {
        return this.watch?.toString() || "";
    }
    get subscribersLength() {
        return this.listeners.length;
    }
    deliverValue(value, prev) {
        for (const handle of this.listeners) {
            this.deliverValueToSubscriber(handle, value, prev);
        }
    }
    deliverValueToSubscriber(handle, value, prev) {
        handle.callback.call(handle.scope, value, prev);
    }
}
export class ValueLogicObserver extends Value {
    listeners = [];
    watch1;
    watch2;
    prev;
    value;
    transform;
    constructor(watch1, watch2, transform) {
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
    dispose() {
        if (this.disposed)
            return;
        this.watch1 = undefined;
        this.watch2 = undefined;
        this.listeners.splice(0, this.listeners.length);
        super.dispose();
    }
    subscribe(callback, scope = this) {
        const handle = {
            callback,
            scope
        };
        this.listeners.push(handle);
        this.deliverValueToSubscriber(handle, this.value, this.prev);
        return () => {
            this.listeners.splice(this.listeners.indexOf(handle), 1);
        };
    }
    get() {
        return this.value;
    }
    toString() {
        return `${this.watch1?.toString()} ${this.watch2?.toString()}`;
    }
    get subscribersLength() {
        return this.listeners.length;
    }
    deliverValue(value, prev) {
        for (const handle of this.listeners) {
            this.deliverValueToSubscriber(handle, value, prev);
        }
    }
    deliverValueToSubscriber(handle, value, prev) {
        handle.callback.call(handle.scope, value, prev);
    }
}
//# sourceMappingURL=value.js.map