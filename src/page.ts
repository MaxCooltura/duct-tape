import { App } from "./app";
import { DOMNode, create } from "./dom";

export interface PageConstructor<T_STORE, T_CONFIG> {
    new(app: App<T_STORE, T_CONFIG>, store: T_STORE, config: T_CONFIG, classNames?: string | string[]): Page<T_STORE, T_CONFIG>;
}

export abstract class Page<T_STORE, T_CONFIG> extends DOMNode<"div"> {
    protected readonly _app: App<T_STORE, T_CONFIG>;
    protected readonly _store: T_STORE;
    protected readonly _config: T_CONFIG;

    constructor(app: App<T_STORE, T_CONFIG>, store: T_STORE, config: T_CONFIG
    ) {
        super("div");

        this._app = app;
        this._store = store;
        this._config = config;
    }

    async load(): Promise<void | Promise<void>> {
        return Promise.resolve();
    }

    async unload(): Promise<void | Promise<void>> {
        return Promise.resolve();
    }
}