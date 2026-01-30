import { App } from "./app";
import { DOMNode, DOMNodeEventMap } from "./dom";

export interface ModalOptions<T_STORE, T_CONFIG> {
    app: App<T_STORE, T_CONFIG>;
    store: T_STORE;
    config: T_CONFIG;
    classNames?: string | string[];
    onafterload?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onafterunload?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onaftershow?: (modal: Modal<T_STORE, T_CONFIG>) => void;
    onafterclose?: (modal: Modal<T_STORE, T_CONFIG>) => void;
}

export class Modal<T_STORE, T_CONFIG> extends DOMNode<"div"> {
    protected app?: App<T_STORE, T_CONFIG>;
    protected store?: T_STORE;
    protected config?: T_CONFIG;
    protected options?: ModalOptions<T_STORE, T_CONFIG>;

    constructor(options: ModalOptions<T_STORE, T_CONFIG>) {
        super("div");

        this.app = options.app;
        this.store = options.store;
        this.config = options.config;
        this.options = options;

        if (options.classNames) {
            if (Array.isArray(options.classNames)) {
                this.class([...options.classNames]);
            } else {
                this.class(options.classNames);
            }
        }
    }

    async load() {
        if (this.options?.onafterload) {
            this.options.onafterload(this);
        }
    }

    async unload() {
        if (this.options?.onafterunload) {
            this.options.onafterunload(this);
        }
    }

    async show() {
        if (this.options?.onaftershow) {
            this.options.onaftershow(this);
        }
    }

    async close() {
        await this.app?.removeModal(this);

        if (this.options?.onafterclose) {
            this.options.onafterclose(this);
        }
    }
}
