import { App } from "./app";
import { DOMNode, DOMNodeEventMap } from "./dom";

export interface ModalOptions<T_STORE, T_CONFIG> {
    classNames?: string | string[];
    onafterload?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onafterunload?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onaftershow?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onafterclose?: (modal: Modal<T_STORE, T_CONFIG>) => void;
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
        if (this._options?.onafterload) {
            this._options.onafterload(this);
        }
    }

    async unload() {
        if (this._options?.onafterunload) {
            this._options.onafterunload(this);
        }
    }

    async show() {
        if (this._options?.onaftershow) {
            this._options.onaftershow(this);
        }
    }

    async close() {
        await this._app?.removeModal(this);

        if (this._options?.onafterclose) {
            this._options.onafterclose(this);
        }
    }
}
