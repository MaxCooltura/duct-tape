import { createValue, Value, ValueObserver, ValueStore } from "../src/value";
import { create } from "../src/dom";
import { Disposable, DummyDisposable } from "../src/disposable";

const store = createValue("Foo");
const store2 = createValue("Bar");

class TestClass extends Disposable {
    private _value: ValueStore<string>;

    constructor(value: ValueStore<string>) {
        super();

        this._value = value;

        create("pre", this)
            .text(this._value.format(v => `Current value: ${v}`, this))
            .mount(document.body);

        create("pre", this)
            .text(this._value.or(store2).map(v => `Or value: ${v}`, this))
            .mount(document.body);
    }

    override dispose(): void {
        if (this._disposed) {
            return;
        }

        console.log("Disposing TestClass");

        super.dispose();
    }
}


let instance: TestClass | null = null;

function main() {
    create("button")
        .text("Create")
        .on("click", () => {
            if (!instance) {
                instance = new TestClass(
                    store
                );
            } else {
                console.log("Instance already created");
            }
        })
        .mount(document.body);

    create("button")
        .text("Dispose")
        .on("click", () => {
            if (instance) {
                instance.dispose();
                instance = null;
            }
        })
        .mount(document.body);
}

main();
