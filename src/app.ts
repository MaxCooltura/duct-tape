import { Disposable } from "./disposable";
import { Modal } from "./modal";
import { Page, PageConstructor } from "./page";
import { Service } from "./service";
import { create, DOMNode } from "./dom";
import { Value, ValueStore } from "./value";

export function encodeParams(map: Map<string, string>): string {
    const arr: string[] = [];
    map.forEach((value, key) => {
        arr.push(`${encodeURI(key)}=${encodeURI(value)}`);
    });

    return arr.join("&");
}

export function decodeParams(value: string): Map<string, string> {
    const arr: string[] = value.split("&");
    const params = new Map<string, string>();
    arr.forEach((v) => {
        const kv = v.split("=");
        if (kv.length === 2) {
            params.set(decodeURI(kv[0]), decodeURI(kv[1]));
        }
    });

    return params;
}

export interface AppOptions<T_STORE> {
    store: T_STORE;
}

export class App<T_STORE, T_CONFIG> extends Disposable {
    private readonly pageContainer: DOMNode<"div">;
    private readonly modalsElement: DOMNode<"div">;
    private readonly _services: Map<string, Service> = new Map();
    private readonly modals: Modal<T_STORE, T_CONFIG>[] = [];
    private readonly pages: Map<PageConstructor<T_STORE, T_CONFIG>, string | string[] | undefined> = new Map();
    public readonly store: T_STORE;
    public readonly config: T_CONFIG;

    private lastHash?: string;
    private _currentPage?: Page<T_STORE, T_CONFIG>;
    public readonly pageId: ValueStore<PageConstructor<T_STORE, T_CONFIG> | null> = new ValueStore<PageConstructor<T_STORE, T_CONFIG> | null>(null);

    static create<T_STORE, T_CONFIG>(
        parent: HTMLElement,
        store: T_STORE,
        config: T_CONFIG,
        className: string | string[] = []
    ): App<T_STORE, T_CONFIG> {
        return new App<T_STORE, T_CONFIG>(parent, store, config, className);
    }

    protected constructor(parent: HTMLElement, store: T_STORE, config: T_CONFIG, className: string | string[] = []) {
        super();

        this.store = store;
        this.config = config;

        this.pageContainer = this.register(create("div").class(className).mount(parent));
        this.modalsElement = this.register(create("div").class("modals").style("display", "none").mount(parent));

        // TODO: move to extternal init function + add event system
        // const callback = this.navigateFromHash.bind(this);
        // window.addEventListener("hashchange", callback);
        // this.register(() => {
        //     window.removeEventListener("hashchange", callback);
        // });
    }

    // setParent(parent: HTMLElement): void {
    //     parent.append(this.pageContainer.element, this.modalsElement.element);
    // }
    findPageByName(name: string): PageConstructor<T_STORE, T_CONFIG> | undefined {
        for (const pageConstructor of this.pages.keys()) {
            if (pageConstructor.name === name) {
                return pageConstructor;
            }
        }
        console.warn(`Page with name "${name}" not found.`);
        return undefined;
    }

    registerPage(pageConstructor: PageConstructor<T_STORE, T_CONFIG>, classNames?: string | string[]): void {
        if (this.pages.has(pageConstructor)) {
            throw new Error(`Page "${pageConstructor.name}" is already registered.`);
        }
        this.pages.set(pageConstructor, classNames);
    }

    registerService(
        service: Service
    ): App<T_STORE, T_CONFIG> {
        if (this._services.has(service.name)) {
            throw new Error(`Service "${service.name}" is already registered.`);
        }

        this._services.set(service.name, service);
        return this;
    }

    // getService<T extends Service<T_STORE, T_CONFIG>>(id: ServiceConstructor<T_STORE, T_CONFIG>): T {
    //     if (!this._services.has(id)) {
    //         throw new Error(`Unknown service ${id}`);
    //     }

    //     return this._services.get(id) as T;
    // }

    get currentPage(): Page<T_STORE, T_CONFIG> | undefined {
        return this._currentPage;
    }

    async navigate(to: PageConstructor<T_STORE, T_CONFIG>, params: Map<string, string> = new Map()): Promise<void> {
        // const newHash = `${to}@${encodeParams(new Map([...params, ...this.getData()]))}`;
        // if (newHash === this.lastHash) return;

        // this.lastHash = newHash;
        const nextPage = this.pages.has(to) ? to : undefined;

        if (!nextPage) {
            console.warn(`Page with name "${to.name}" not found.`);
            throw new Error(`Unknown page "${to.name}". Did you forget to register it?`);
        }

        this.removeAllModals();
        // setProgress(0);
        // loader?.classList.remove("none");
        // pages.style.setProperty("visibility", "hidden");

        if (this._currentPage) {
            await this._currentPage.unload();
            this._currentPage.dispose();

            if (this.pageContainer.element.children.length > 0) {
                const className = (this._currentPage as object).constructor.name;
                console.warn(
                    `Detect memory leak in class "${className}". Probably the class "${className}" left a content in the main container. ${this.pageContainer.element.innerHTML}`
                );

                this.pageContainer.element.textContent = "";
            }

            this._currentPage = undefined;
        }

        // const params: Map<string, string> = new Map();
        // for (const s of params) {
        //   const p = s.split("=");
        //   params.set(p[0], p[1] ?? p[0]);
        // }

        this._currentPage = new nextPage(this, this.store, this.config, this.pages.get(to));
        this.pageId.set(to);
        await this._currentPage.load();
        this._currentPage.mount(this.pageContainer.element);

        // loader?.classList.add("none");
        // pages.style.removeProperty("visibility");

        // if (location.hash.slice(1) !== newHash) {
        //     location.hash = newHash;
        // }
    }

    // TODO: zachowanie specyficzne, przenieść do rozszerzenia
    // navigateFromHash(): void {
    //     const path = location.hash.slice(1);
    //     const params = path.split("@");
    //     const to = params[0] ?? "";
    //     const data = params[1] ?? "";

    //     this.navigate(to, decodeParams(data));
    // }

    // getData(): Map<string, string> {
    //     const path = location.hash.slice(1);
    //     const params = path.split("@");
    //     const data = params[1] ?? "";

    //     return decodeParams(data);
    // }

    runViewportObserver(): void {
        const appHeight = () => {
            const doc = document.documentElement;
            doc.style.setProperty("--app-height", `${window.innerHeight}px`);
        };
        window.addEventListener("resize", appHeight);
        appHeight();
    }

    async setup(): Promise<void> {
        for (const [, service] of this._services) {
            await service.load();
        }
        for (const [, service] of this._services) {
            await service.run();
        }
    }

    async addModal(modal: Modal<T_STORE, T_CONFIG>): Promise<void> {
        if (this.modals.includes(modal)) {
            return;
        }

        this.modals.push(modal);
        modal.mount(this.modalsElement);
        await modal.load();
        this.updateModals();
        await modal.show();
    }

    async addModalAndWait(modal: Modal<T_STORE, T_CONFIG>): Promise<void> {
        return new Promise<void>(async (resolve) => {
            await this.addModal(modal);
            modal.on("afterClose", () => {
                resolve();
            });
        });
    }

    async removeModal(modal: Modal<T_STORE, T_CONFIG>): Promise<void> {
        if (!this.modals.includes(modal)) {
            return;
        }

        this.modals.splice(this.modals.indexOf(modal), 1);
        await modal.close();
        await modal.unload();
        modal.dispose();
        this.updateModals();
    }

    removeAllModals(): void {
        let modal: Modal<T_STORE, T_CONFIG> | undefined;
        while ((modal = this.modals.pop())) {
            modal.dispose();
        }
        this.updateModals();
    }

    private updateModals(): void {
        if (this.modals.length > 0) {
            this.modalsElement.element.style.display = "flex";
        } else {
            this.modalsElement.element.style.display = "none";
        }
    }
}
