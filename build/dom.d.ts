import { Disposable } from "./disposable";
import { Value } from "./value";
export type DOMNodeEventMap = {
    changeParent: Element;
};
export interface DOMNodeConstructor<T extends keyof HTMLElementTagNameMap> {
    new (selector: T): DOMNode<T>;
}
export declare function create<T extends keyof HTMLElementTagNameMap>(selector: T, scope?: Disposable): DOMNode<T>;
export declare class DOMNode<T extends keyof HTMLElementTagNameMap> extends Disposable {
    private _element;
    constructor(selector: T);
    attr(name: string, value: string | number | Value<unknown>): DOMNode<T>;
    property(name: string): string | undefined;
    property(name: string, value: string | number | boolean | Value<unknown>): DOMNode<T>;
    style(name: string, value: string | Value<string>): DOMNode<T>;
    class(className: string | string[], active?: boolean | Value<boolean>): DOMNode<T>;
    on(eventType: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): DOMNode<T>;
    off(eventType: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): DOMNode<T>;
    text(content: string | Value<string | number>): DOMNode<T>;
    html(content: string): DOMNode<T>;
    append(...children: DOMNode<any>[]): DOMNode<T>;
    mount(parent: Element | DOMNode<any>): DOMNode<T>;
    get element(): HTMLElementTagNameMap[T];
}
