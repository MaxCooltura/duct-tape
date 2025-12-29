import { Disposable } from "./disposable";
import { Value } from "./value";

// export const SELECTOR_REGEX = /([\w-]+)?(#([\w-]+))?((\.([\w-]+))*)/;

// export enum DOMNamespace {
//     HTML = "http://www.w3.org/1999/xhtml",
//     SVG = "http://www.w3.org/2000/svg"
// }

// export type DOMAttrs = {
//     [key: string]: undefined | string | number | EventListenerOrEventListenerObject;
// };

// export type DOMChild = Node | string | ((owner: Element) => Node);

// create("div")
//     .attr("id", "app")
//     .class("container")
//     .append(
//         create("h1").text("Welcome to My App"),
//         create("button")
//             .text("Click Me")
//             .on("click", () => alert("Button Clicked!"))
//     )
//     .mount(document.body);

export type DOMNodeEventMap = {
    changeParent: Element;
};

export interface DOMNodeConstructor<T extends keyof HTMLElementTagNameMap> {
    new(selector: T): DOMNode<T>;
}

export function create<T extends keyof HTMLElementTagNameMap>(selector: T, scope?: Disposable): DOMNode<T> {
    const dom = new DOMNode<T>(selector);

    if (scope instanceof Disposable) {
        scope.register(dom);
    }

    return dom;
}

export class DOMNode<T extends keyof HTMLElementTagNameMap> extends Disposable {
    private _element: HTMLElementTagNameMap[T];

    constructor(selector: T) {
        super();

        const match = selector.split(":");
        if (match.length === 1) {
            this._element = document.createElement(selector);
        } else if (match.length === 2) {
            const namespace = match[0];
            const tagName = match[1];
            this._element = document.createElementNS(namespace, tagName) as HTMLElementTagNameMap[T];
        } else {
            throw new Error("Invalid selector");
        }
    }

    attr(name: string, value: string | number | Value<unknown>): DOMNode<T> {
        if (value instanceof Value) {
            this.register(
                value.subscribe((val) => {
                    this._element.setAttribute(name, String(val));
                })
            );
        } else {
            this._element.setAttribute(name, String(value));
        }
        return this;
    }

    property(name: string): string | undefined
    property(name: string, value: string | number | boolean | Value<unknown>): DOMNode<T>
    property(name: string, value?: string | number | boolean | Value<unknown>): DOMNode<T> | string | undefined {
        if (value === undefined) {
            return (this._element as any)[name];
        }

        if (value instanceof Value) {
            this.register(
                value.subscribe((val) => {
                    (this._element as any)[name] = val;
                })
            );
        } else {
            (this._element as any)[name] = value;
        }
        return this;
    }

    style(name: string, value: string | Value<string>): DOMNode<T> {
        if (value instanceof Value) {
            this.register(
                value.subscribe((val) => {
                    (this._element.style as any)[name] = val;
                })
            );
        } else {
            (this._element.style as any)[name] = value;
        }
        return this;
    }

    class(className: string | string[], active: boolean | Value<boolean> = true): DOMNode<T> {
        if (active instanceof Value) {
            this.register(
                active.subscribe((val) => {
                    if (val) {
                        if (Array.isArray(className)) {
                            this._element.classList.add(...className);
                        } else {
                            this._element.classList.add(className);
                        }
                    } else {
                        if (Array.isArray(className)) {
                            this._element.classList.remove(...className);
                        } else {
                            this._element.classList.remove(className);
                        }
                    }
                })
            );
        } else {
            if (active) {
                if (Array.isArray(className)) {
                    this._element.classList.add(...className);
                } else {
                    this._element.classList.add(className);
                }
            } else {
                if (Array.isArray(className)) {
                    this._element.classList.remove(...className);
                } else {
                    this._element.classList.remove(className);
                }
            }
        }
        return this;
    }

    on(eventType: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): DOMNode<T> {
        this._element.addEventListener(eventType, listener, options);
        this.register(() => {
            this._element.removeEventListener(eventType, listener, options);
        });
        return this;
    }

    off(eventType: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): DOMNode<T> {
        this._element.removeEventListener(eventType, listener, options);
        return this;
    }

    text(content: string | Value<string | number>): DOMNode<T> {
        if (content instanceof Value) {
            const textNode = document.createTextNode("");
            this._element.appendChild(textNode);
            this.register(
                content.subscribe((val) => {
                    textNode.textContent = String(val);
                })
            );
        } else {
            this._element.innerText = String(content);
        }
        return this;
    }

    html(content: string): DOMNode<T> {
        this._element.innerHTML = content;
        return this;
    }

    append(...children: DOMNode<any>[]): DOMNode<T> {
        for (const child of children) {
            this._element.appendChild(child.element);
        }
        return this;
    }

    mount(parent: Element | DOMNode<any>): DOMNode<T> {
        if (parent instanceof DOMNode) {
            parent._element.appendChild(this._element);
        } else {
            parent.appendChild(this._element);
        }
        return this;
    }

    get element(): HTMLElementTagNameMap[T] {
        return this._element;
    }
}
