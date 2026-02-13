import { App } from "./app";
import { DOMNode, DOMNodeEventMap } from "./dom";

export interface ModalOptions<T_STORE, T_CONFIG> {
    classNames?: string | string[];
    onAfterLoad?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onAfterUnload?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onAfterShow?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onAfterClose?: (modal: Modal<T_STORE, T_CONFIG>) => void;
}

export class Modal<T_STORE, T_CONFIG> extends DOMNode<"div"> {
    protected _app: App<T_STORE, T_CONFIG>;
    protected _store: T_STORE;
    protected _config: T_CONFIG;
    protected _options: ModalOptions<T_STORE, T_CONFIG>;

    constructor(app: App<T_STORE, T_CONFIG>, store: T_STORE, config: T_CONFIG, options: ModalOptions<T_STORE, T_CONFIG>) {
        super("div");

        this._app = app;
        this._store = store;
        this._config = config;
        this._options = options;

        if (options.classNames) {
            if (Array.isArray(options.classNames)) {
                this.class([...options.classNames]);
            } else {
                this.class(options.classNames);
            }
        }
    }

    async load() {
        if (this._options?.onAfterLoad) {
            this._options.onAfterLoad(this);
        }
    }

    async unload() {
        if (this._options?.onAfterUnload) {
            this._options.onAfterUnload(this);
        }
    }

    async show() {
        if (this._options?.onAfterShow) {
            this._options.onAfterShow(this);
        }
    }

    async close() {
        await this._app?.removeModal(this);

        if (this._options?.onAfterClose) {
            this._options.onAfterClose(this);
        }
    }
}
