import { Disposable } from "./disposable";
import { Value } from "./value";
export interface DOMEventListener {
    eventType: string;
    listener: EventListenerOrEventListenerObject;
}
export type DOMNodeEventMap = {
    changeParent: Element;
};
export interface DOMNodeConstructor<T extends keyof HTMLElementTagNameMap> {
    new (selector: T): DOMNode<T>;
}
export declare function create<T extends keyof HTMLElementTagNameMap>(selector: T, register?: Disposable): DOMNode<T>;
export declare class DOMNode<T extends keyof HTMLElementTagNameMap> extends Disposable {
    private _element;
    private _events;
    private _register?;
    static create<T extends keyof HTMLElementTagNameMap>(selector: T, register?: Disposable): DOMNode<T>;
    protected constructor(selector: T, register?: Disposable);
    dispose(): void;
    attr(name: string, value: string | number | Value<unknown>): this;
    property(name: string): string | undefined;
    property(name: string, value: string | number | boolean | Value<unknown>): this;
    style(name: string, value: string | Value<string>): this;
    class(className: string | string[], active?: boolean | Value<boolean>): this;
    on(eventType: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): this;
    off(eventType: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): this;
    datum<D>(data?: D): this | D;
    text(content: string | Value<string | number>): this;
    html(content: string): this;
    append(...children: DOMNode<any>[]): this;
    mount(parent: Element | DOMNode<any>): this;
    get element(): HTMLElementTagNameMap[T];
}
