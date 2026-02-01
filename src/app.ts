import { Disposable } from "./disposable";
import { Modal } from "./modal";
import { Page, PageConstructor } from "./page";
import { Service } from "./service";
import { create, DOMNode } from "./dom";
import { Value, ValueStore } from "./value";
import { log } from "./utils/log";

export enum PageType {
    Normal,
    Background,
    Overflow
}

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
    appClassName?: string | string[];
    backgroundContainerEnabled?: boolean;
    backgroundContainerClassName?: string | string[];
    pageContainerClassName?: string | string[];
    overflowContainerEnabled?: boolean;
    overflowContainerClassName?: string | string[];
    modalContainerClassName?: string | string[];
}

export class App<T_STORE, T_CONFIG> extends Disposable {
    public readonly appDiv: DOMNode<"div">;
    private readonly backgroundContainer?: DOMNode<"div">;
    private readonly pageContainer: DOMNode<"div">;
    private readonly overflowContainer?: DOMNode<"div">;
    private readonly modalsContainer: DOMNode<"div">;
    private readonly _services: Map<string, Service> = new Map();
    private readonly modals: Modal<T_STORE, T_CONFIG>[] = [];
    private readonly pagesConstructors: PageConstructor<T_STORE, T_CONFIG>[] = [];
    private readonly backgroundPageConstructors: PageConstructor<T_STORE, T_CONFIG>[] = [];
    private readonly overflowPageConstructors: PageConstructor<T_STORE, T_CONFIG>[] = [];
    private readonly _options: AppOptions<T_STORE>;
    public readonly store: T_STORE;
    public readonly config: T_CONFIG;

    private backgroundPages: Page<T_STORE, T_CONFIG>[] = [];
    private overflowPages: Page<T_STORE, T_CONFIG>[] = [];
    private _currentPage?: Page<T_STORE, T_CONFIG>;
    public readonly pageId: ValueStore<PageConstructor<T_STORE, T_CONFIG> | null> = new ValueStore<PageConstructor<T_STORE, T_CONFIG> | null>(null);

    static create<T_STORE, T_CONFIG>(
        parent: HTMLElement,
        store: T_STORE,
        config: T_CONFIG,
        options: AppOptions<T_STORE> = {}
    ): App<T_STORE, T_CONFIG> {
        return new App<T_STORE, T_CONFIG>(parent, store, config, options);
    }

    protected constructor(parent: HTMLElement, store: T_STORE, config: T_CONFIG, options: AppOptions<T_STORE> = {}) {
        super();

        log.debug("Greetings from DuctTape Engine! 🥳");

        this.store = store;
        this.config = config;
        this._options = options;

        this.appDiv = this.register(create("div").class(options.appClassName ?? []).mount(parent));
        if (options.backgroundContainerEnabled === true) {
            this.backgroundContainer = this.register(create("div").class(options.backgroundContainerClassName ?? []).mount(this.appDiv));
        }
        this.pageContainer = this.register(create("div").class(options.pageContainerClassName ?? []).mount(this.appDiv));
        if (options.overflowContainerEnabled === true) {
            this.overflowContainer = this.register(create("div").class(options.overflowContainerClassName ?? []).mount(this.appDiv));
        }
        this.modalsContainer = this.register(create("div").class(options.modalContainerClassName ?? []).style("display", "none").mount(this.appDiv));
        // TODO: move to extternal init function + add event system
        // const callback = this.navigateFromHash.bind(this);
        // window.addEventListener("hashchange", callback);
        // this.register(() => {
        //     window.removeEventListener("hashchange", callback);
        // });
    }

    override dispose(): void {
        this.removeAllModals();

        if (this.backgroundPages.length > 0) {
            this.backgroundPages.forEach(page => page.dispose());
            this.backgroundPages = [];
        }

        if (this.overflowPages.length > 0) {
            this.overflowPages.forEach(page => page.dispose());
            this.overflowPages = [];
        }

        if (this._currentPage) {
            this._currentPage.dispose();
        }

        this.pageId.dispose();

        super.dispose();
    }

    findPageByName(name: string): PageConstructor<T_STORE, T_CONFIG> | undefined {
        for (const pageConstructor of this.pagesConstructors) {
            if (pageConstructor.name === name) {
                return pageConstructor;
            }
        }
        log.error(`Page with name "${name}" not found.`);
        return undefined;
    }

    registerPage(pageConstructor: PageConstructor<T_STORE, T_CONFIG>, type: PageType = PageType.Normal): void {
        if (type === PageType.Background) {
            if (this._options.backgroundContainerEnabled !== true || !this.backgroundContainer) {
                log.error("Background container is not enabled in App options.");
                return;
            }

            for (const page of this.backgroundPages) {
                if (pageConstructor === (page as any).constructor) {
                    log.error(`Background page "${pageConstructor.name}" is already added.`);
                    return;
                }
            }

            this.backgroundPageConstructors.push(pageConstructor);
        } else if (type === PageType.Overflow) {

            if (this._options.overflowContainerEnabled !== true || !this.overflowContainer) {
                log.error("Overflow container is not enabled in App options.");
                return;
            }

            for (const page of this.overflowPageConstructors) {
                if (pageConstructor === page) {
                    log.error(`Overflow page "${pageConstructor.name}" is already added.`);
                    return;
                }
            }

            this.overflowPageConstructors.push(pageConstructor);
        } else {
            if (this.pagesConstructors.includes(pageConstructor)) {
                log.error(`Page "${pageConstructor.name}" is already registered.`);
                return;
            }
            this.pagesConstructors.push(pageConstructor);
        }
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

    get currentPage(): Page<T_STORE, T_CONFIG> | undefined {
        return this._currentPage;
    }

    async navigate(to: PageConstructor<T_STORE, T_CONFIG>, params: Map<string, string> = new Map()): Promise<void> {
        // const newHash = `${to}@${encodeParams(new Map([...params, ...this.getData()]))}`;
        // if (newHash === this.lastHash) return;

        // this.lastHash = newHash;
        const nextPage = this.pagesConstructors.includes(to) ? to : undefined;

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
                    `Detect memory leak in class "${className}". Probably the class "${className}" left a content in the main container. ${this.appDiv.element.innerHTML}`
                );

                this.appDiv.element.textContent = "";
            }

            this._currentPage = undefined;
        }

        // const params: Map<string, string> = new Map();
        // for (const s of params) {
        //   const p = s.split("=");
        //   params.set(p[0], p[1] ?? p[0]);
        // }

        this._currentPage = new nextPage(this, this.store, this.config);
        this.pageId.set(to);
        await this._currentPage.load();
        this._currentPage.mount(this.pageContainer);

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

        // Setup background pages
        if (this.backgroundContainer) {
            for (const pageConstructor of this.backgroundPageConstructors) {
                const page = new pageConstructor(this, this.store, this.config);
                page.mount(this.backgroundContainer);
                this.backgroundPages.push(page);
                await page.load();
            }
        }

        // Setup overflow pages
        if (this.overflowContainer) {
            for (const pageConstructor of this.overflowPageConstructors) {
                const page = new pageConstructor(this, this.store, this.config);
                page.mount(this.overflowContainer);
                this.overflowPages.push(page);
                await page.load();
            }
        }
    }

    async addModal(modal: Modal<T_STORE, T_CONFIG>): Promise<void> {
        if (this.modals.includes(modal)) {
            return;
        }

        this.modals.push(modal);
        modal.mount(this.modalsContainer);
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
            this.modalsContainer.element.style.display = "flex";
        } else {
            this.modalsContainer.element.style.display = "none";
        }
    }
}
