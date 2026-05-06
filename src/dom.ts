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

const SVG_TAGS = new Set([
  "svg", "circle", "rect", "path", "line", "ellipse", "polygon", "polyline", "g", "defs", "symbol", "use", "text", "tspan"
]);

export interface DOMEventListener {
  eventType: string;
  listener: EventListenerOrEventListenerObject;
}

export type DOMNodeEventMap = {
  changeParent: Element;
};

export interface DOMNodeConstructor<T extends keyof (HTMLElementTagNameMap & SVGElementTagNameMap)> {
  new(selector: T): DOMNode<T>;
}

export function create<T extends keyof (HTMLElementTagNameMap & SVGElementTagNameMap)>(
  selector: T,
  owner: Disposable | null,
): DOMNode<T> {
  const dom = DOMNode.create<T>(selector, owner);

  return dom;
}

type DOMElementTagNameMap = HTMLElementTagNameMap & SVGElementTagNameMap;

export class DOMNode<T extends keyof DOMElementTagNameMap> extends Disposable {
  private _element: DOMElementTagNameMap[T] = null as any;
  private _events: Map<DisposeFn, DOMEventListener> = new Map();
  private _owner: Disposable | null = null;

  static create<T extends keyof DOMElementTagNameMap>(
    selector: T,
    owner: Disposable | null,
  ): DOMNode<T> {
    const dom = new DOMNode<T>(selector, owner);
    return dom;
  }

  protected constructor(selector: T, owner: Disposable | null) {
    super();

    this._owner = owner;

    if (SVG_TAGS.has(selector)) {
      this._element = document.createElementNS('http://www.w3.org/2000/svg', selector) as unknown as DOMElementTagNameMap[T];
    } else {
      this._element = document.createElement(selector) as DOMElementTagNameMap[T];
    }

    if (this._owner) {
      this._owner.register(this);
    }

    // const match = selector.split(':');
    // if (match.length === 1) {
    //   this._element = document.createElement(selector);
    // } else if (match.length === 2) {
    //   const namespace = match[0];
    //   const tagName = match[1];

    //   if (namespace === 'svg') {
    //     this._element = document.createElementNS('http://www.w3.org/2000/svg', tagName) as unknown as SVGElement;
    //   } if (namespace === 'html') {
    //     this._element = document.createElementNS(
    //       'http://www.w3.org/1999/xhtml',
    //       tagName,
    //     ) as HTMLElement;
    //   } else {
    //     throw new Error('Invalid selector');
    //   }

    //   if (this._owner) {
    //     this._owner.register(this);
    //   }
    // }
  }

  override dispose(): void {
    if (this._disposed) {
      return;
    }

    this._element.remove();

    if (this._owner) {
      this._owner.unregister(this);
      this._owner = null;
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
    value: string | number | boolean | null | Value<unknown>,
  ): this;
  property(
    name: string,
    value?: string | number | boolean | null | Value<unknown>,
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
      if (value === null || value === undefined || value === "") {
        delete (this._element as any)[name];
      } else {
        (this._element as any)[name] = value;
      }
    }
    return this;
  }

  style(name: string): string | undefined;
  style(name: string, value: string | Value<string>): this;
  style(name: string, value: string | Value<string>, condition: boolean | Value<boolean>): this;
  style(name: string, value?: string | Value<string>, condition?: boolean | Value<boolean>): this | string | undefined {
    if (value === undefined) {
      return this._element.style.getPropertyValue(name);
    }

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
    } else if (condition === true || condition === undefined) {
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

    return this;
  }

  class(
    className: string | string[] | undefined,
    active: boolean | Value<boolean> = true,
  ): this {
    if (className === undefined) {
      return this;
    }

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

  empty(): this {
    [...this._disposables].forEach(([key, dispose]) => {
      if (key instanceof DOMNode) {
        if (key._owner !== this) {
          console.warn(`Cannot dispose child DOMNode that is not owned by this node.`, key);
          return;
        }
        key.dispose();
      }
    });

    this._element.innerHTML = '';

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
    this.empty();

    if (content instanceof Value) {
      this.register(
        content.subscribe((val) => {
          if (this.element instanceof HTMLElement) {
            if (val === null || val === undefined) {
              (this._element as HTMLElement).innerText = '';
            } else {
              (this._element as HTMLElement).innerText = String(val);
            }
          }
        }),
      );
    } else {
      if (this.element instanceof HTMLElement) {
        (this._element as HTMLElement).innerText = String(content);
      }
    }

    return this;
  }

  html(content: string): this {
    this.empty();
    this._element.innerHTML = content;
    return this;
  }

  visible(isVisible: boolean | Value<boolean>): this {
    if (isVisible instanceof Value) {
      this.register(
        isVisible.subscribe((visible) => {
          this._element.style.display = visible ? '' : 'none';
        }),
      );
    } else {
      this._element.style.display = isVisible ? '' : 'none';
    }
    return this;
  }

  append(...children: DOMNode<any>[]): this {
    for (const child of children) {
      child.mount(this);
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

  get element(): DOMElementTagNameMap[T] {
    return this._element;
  }

  get owner(): Disposable | null {
    return this._owner;
  }
}
