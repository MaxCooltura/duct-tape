import { createDisposeFn, Disposable, DisposeFn } from './disposable';
import { Value } from './value';

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

export interface DOMEventListener {
  eventType: string;
  listener: EventListenerOrEventListenerObject;
}

export type DOMNodeEventMap = {
  changeParent: Element;
};

export interface DOMNodeConstructor<T extends keyof HTMLElementTagNameMap> {
  new(selector: T): DOMNode<T>;
}

export function create<T extends keyof HTMLElementTagNameMap>(
  selector: T,
  register?: Disposable,
): DOMNode<T> {
  const dom = DOMNode.create<T>(selector, register);

  return dom;
}

export class DOMNode<T extends keyof HTMLElementTagNameMap> extends Disposable {
  private _element: HTMLElementTagNameMap[T];
  private _events: Map<DisposeFn, DOMEventListener> = new Map();
  private _register?: Disposable;

  static create<T extends keyof HTMLElementTagNameMap>(
    selector: T,
    register?: Disposable,
  ): DOMNode<T> {
    const dom = new DOMNode<T>(selector, register);
    return dom;
  }

  protected constructor(selector: T, register?: Disposable) {
    super();

    this._register = register;

    const match = selector.split(':');
    if (match.length === 1) {
      this._element = document.createElement(selector);
    } else if (match.length === 2) {
      const namespace = match[0];
      const tagName = match[1];
      this._element = document.createElementNS(
        namespace,
        tagName,
      ) as HTMLElementTagNameMap[T];
    } else {
      throw new Error('Invalid selector');
    }

    if (this._register) {
      this._register.register(this);
    }
  }

  override dispose(): void {
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

  attr(name: string): string | null;
  attr(name: string, value: string | number | null | Value<unknown>, condition?: boolean | Value<boolean>): this;
  attr(name: string, value?: string | number | null | Value<unknown>, condition?: boolean | Value<boolean>): this | string | null {
    if (value === undefined && condition === undefined) {
      return this._element.getAttribute(name);
    }

    if (condition instanceof Value) {
      this.register(
        condition.subscribe((cond) => {
          if (cond) {
            if (value instanceof Value) {
              this.register(
                value.subscribe((val) => {
                  if (val === null || val === undefined || val === "") {
                    this._element.removeAttribute(name);
                  } else {
                    this._element.setAttribute(name, String(val));
                  }
                }),
              );
            } else {
              if (value === null || value === undefined || value === "") {
                this._element.removeAttribute(name);
              } else {
                this._element.setAttribute(name, String(value));
              }
            }
          } else {
            this._element.removeAttribute(name);
          }
        }),
      );
    } else if (condition === true) {
      if (value instanceof Value) {
        this.register(
          value.subscribe((val) => {
            if (val === null || val === undefined || val === "") {
              this._element.removeAttribute(name);
            } else {
              this._element.setAttribute(name, String(val));
            }
          }),
        );
      } else {
        if (value === null || value === undefined || value === "") {
          this._element.removeAttribute(name);
        } else {
          this._element.setAttribute(name, String(value));
        }
      }
    } else {
      if (value instanceof Value) {
        this.register(
          value.subscribe((v) => {
            if (v === null || v === undefined || v === "" || condition === false) {
              this._element.removeAttribute(name);
            } else {
              this._element.setAttribute(name, String(v));
            }
          }),
        );
      } else {
        if (value === null || value === undefined || value === "" || condition === false) {
          this._element.removeAttribute(name);
        } else {
          this._element.setAttribute(name, String(value));
        }
      }
    }

    return this;
  }

  property(name: string): string | undefined;
  property(
    name: string,
    value: string | number | boolean | Value<unknown>,
  ): this;
  property(
    name: string,
    value?: string | number | boolean | Value<unknown>,
  ): this | string | undefined {
    if (value === undefined) {
      return (this._element as any)[name];
    }

    if (value instanceof Value) {
      this.register(
        value.subscribe((val) => {
          (this._element as any)[name] = val;
        }),
      );
    } else {
      (this._element as any)[name] = value;
    }
    return this;
  }

  style(name: string, value: string | Value<string>, condition: boolean | Value<boolean> = true): this {
    if (condition instanceof Value) {
      this.register(
        condition.subscribe((cond) => {
          if (cond) {
            if (value instanceof Value) {
              this.register(
                value.subscribe((val) => {
                  this._element.style.setProperty(name, val);
                }),
              );
            } else {
              this._element.style.setProperty(name, value);
            }
          } else {
            this._element.style.removeProperty(name);
          }
        }),
      );
    } else if (condition) {
      if (value instanceof Value) {
        this.register(
          value.subscribe((val) => {
            this._element.style.setProperty(name, val);
          }),
        );
      } else {
        this._element.style.setProperty(name, value);
      }
    }

    return this;
  }

  class(
    className: string | string[],
    active: boolean | Value<boolean> = true,
  ): this {
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
        }),
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

  on(
    eventType: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): this {
    for (const [, event] of this._events.entries()) {
      if (event.eventType === eventType && event.listener === listener) {
        console.warn(
          `The event listener for ${eventType} is already registered on this element.`,
        );
        return this;
      }
    }

    this._element.addEventListener(eventType, listener, options);

    if (options && typeof options === 'object' && options.once) {
      return this;
    }

    const dispose = createDisposeFn(() => {
      this._element.removeEventListener(eventType, listener, options);
    });
    this.register(dispose);
    this._events.set(dispose, { eventType, listener });

    return this;
  }

  off(
    eventType: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): this {
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

  // data<D>(data?: D): this | D {
  //   if (arguments.length === 0) {
  //     return (this._element as any).__data__;
  //   } else {
  //     (this._element as any).__data__ = data;
  //     return this;
  //   }
  // }

  dataset(name: string): string | undefined;
  dataset(name: string, value: string | number | null | Value<string | number>): this;
  dataset(name: string, value?: string | number | Value<string | number> | null): this | string | undefined {
    if (arguments.length === 1) {
      return this._element.dataset[name];
    }

    if (value instanceof Value) {
      this.register(
        value.subscribe((val) => {
          this._element.dataset[name] = String(val);
        }),
      );
    } else {
      if (value === null || value === undefined) {
        delete this._element.dataset[name];
      } else {
        this._element.dataset[name] = String(value);
      }
    }
    return this;
  }

  text(content: string | Value<string | number>): this {
    if (content instanceof Value) {
      const textNode = document.createTextNode('');
      this._element.appendChild(textNode);
      this.register(
        content.subscribe((val) => {
          textNode.textContent = String(val);
        }),
      );
    } else {
      this._element.innerText = String(content);
    }
    return this;
  }

  html(content: string): this {
    this._element.innerHTML = content;
    return this;
  }

  append(...children: DOMNode<any>[]): this {
    for (const child of children) {
      this._element.appendChild(child.element);
    }
    return this;
  }

  mount(parent: Element | DOMNode<any>): this {
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

  get parent(): HTMLElement | null {
    return this._element.parentElement;
  }
}
