import { Disposable } from "./disposable";
export class Emitter extends Disposable {
    _emitterHandles;
    constructor() {
        super();
        this._emitterHandles = {};
    }
    dispose() {
        if (this.disposed)
            return;
        this._emitterHandles = {};
        super.dispose();
    }
    on(name, callback, scope = this) {
        this._addCallback(name, callback, scope, false);
        return () => this.off(name, callback, scope);
    }
    once(name, callback, scope = this) {
        this._addCallback(name, callback, scope, true);
        return () => this.off(name, callback, scope);
    }
    off(name, callback, scope = this) {
        const handlesByName = this._emitterHandles[name];
        if (handlesByName) {
            let i = handlesByName.length;
            while (--i >= 0) {
                if (handlesByName[i].callback === callback && handlesByName[i].scope === scope) {
                    handlesByName.splice(i, 1);
                }
            }
        }
    }
    emit(name, value) {
        const handlesByName = this._emitterHandles[name];
        if (!handlesByName) {
            return;
        }
        for (const handle of handlesByName) {
            handle.callback.call(handle.scope, value);
            if (handle.once)
                this.off(name, handle.callback, handle.scope);
        }
    }
    _addCallback(name, callback, scope, once) {
        let handlesByName = this._emitterHandles[name];
        if (!handlesByName) {
            handlesByName = this._emitterHandles[name] = [];
        }
        handlesByName.push({
            callback,
            scope,
            once
        });
    }
}
export default Emitter;
//# sourceMappingURL=emitter.js.map