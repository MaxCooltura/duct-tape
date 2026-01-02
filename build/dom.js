import { createDisposeFn, Disposable } from "./disposable";
import { Value } from "./value";
export function create(selector, register) {
    const dom = DOMNode.create(selector, register);
    return dom;
}
export class DOMNode extends Disposable {
    _element;
    _events = new Map();
    _register;
    static create(selector, register) {
        const dom = new DOMNode(selector, register);
        return dom;
    }
    constructor(selector, register) {
        super();
        this._register = register;
        const match = selector.split(":");
        if (match.length === 1) {
            this._element = document.createElement(selector);
        }
        else if (match.length === 2) {
            const namespace = match[0];
            const tagName = match[1];
            this._element = document.createElementNS(namespace, tagName);
        }
        else {
            throw new Error("Invalid selector");
        }
        if (this._register) {
            this._register.register(this);
        }
    }
    dispose() {
        if (this._disposed) {
            return;
        }
        this._element.remove();
        if (this._register) {
            this._register.unregister(this);
            this._register = undefined;
        }
        super.dispose();
    }
    attr(name, value) {
        if (value instanceof Value) {
            this.register(value.subscribe((val) => {
                this._element.setAttribute(name, String(val));
            }));
        }
        else {
            this._element.setAttribute(name, String(value));
        }
        return this;
    }
    property(name, value) {
        if (value === undefined) {
            return this._element[name];
        }
        if (value instanceof Value) {
            this.register(value.subscribe((val) => {
                this._element[name] = val;
            }));
        }
        else {
            this._element[name] = value;
        }
        return this;
    }
    style(name, value) {
        if (value instanceof Value) {
            this.register(value.subscribe((val) => {
                this._element.style[name] = val;
            }));
        }
        else {
            this._element.style[name] = value;
        }
        return this;
    }
    class(className, active = true) {
        if (active instanceof Value) {
            this.register(active.subscribe((val) => {
                if (val) {
                    if (Array.isArray(className)) {
                        this._element.classList.add(...className);
                    }
                    else {
                        this._element.classList.add(className);
                    }
                }
                else {
                    if (Array.isArray(className)) {
                        this._element.classList.remove(...className);
                    }
                    else {
                        this._element.classList.remove(className);
                    }
                }
            }));
        }
        else {
            if (active) {
                if (Array.isArray(className)) {
                    this._element.classList.add(...className);
                }
                else {
                    this._element.classList.add(className);
                }
            }
            else {
                if (Array.isArray(className)) {
                    this._element.classList.remove(...className);
                }
                else {
                    this._element.classList.remove(className);
                }
            }
        }
        return this;
    }
    on(eventType, listener, options) {
        for (const [, event] of this._events.entries()) {
            if (event.eventType === eventType && event.listener === listener) {
                console.warn(`The event listener for ${eventType} is already registered on this element.`);
                return this;
            }
        }
        this._element.addEventListener(eventType, listener, options);
        const dispose = createDisposeFn(() => {
            this._element.removeEventListener(eventType, listener, options);
        });
        this.register(dispose);
        this._events.set(dispose, { eventType, listener });
        return this;
    }
    off(eventType, listener, options) {
        this._element.removeEventListener(eventType, listener, options);
        for (const [dispose, event] of this._events.entries()) {
            if (event.eventType === eventType && event.listener === listener) {
                this._events.delete(dispose);
                this.unregister(dispose);
                break;
            }
        }
        return this;
    }
    datum(data) {
        if (arguments.length === 0) {
            return this._element.__datum__;
        }
        else {
            this._element.__datum__ = data;
            return this;
        }
    }
    text(content) {
        if (content instanceof Value) {
            const textNode = document.createTextNode("");
            this._element.appendChild(textNode);
            this.register(content.subscribe((val) => {
                textNode.textContent = String(val);
            }));
        }
        else {
            this._element.innerText = String(content);
        }
        return this;
    }
    html(content) {
        this._element.innerHTML = content;
        return this;
    }
    append(...children) {
        for (const child of children) {
            this._element.appendChild(child.element);
        }
        return this;
    }
    mount(parent) {
        if (parent instanceof DOMNode) {
            parent._element.appendChild(this._element);
        }
        else {
            parent.appendChild(this._element);
        }
        return this;
    }
    get element() {
        return this._element;
    }
}
//# sourceMappingURL=dom.js.map