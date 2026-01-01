import { ValueStore } from "../src/value";

// filepath: /Users/dexter/Projects/4s/ORE3/starter/packages/zpe-editor/packages/duct-tape/tests/value.equal.test.ts

describe("Value.equal", () => {
    it("returns a reactive boolean that reflects primitive equality", () => {
        const store = new ValueStore<string>("foo");
        const equalFoo = store.equal("foo");

        const events: Array<{ value: boolean; prev: boolean | undefined }> = [];
        const unsubscribe = equalFoo.subscribe((value, prev) => {
            events.push({ value, prev });
        });

        expect(equalFoo.get()).toBe(true);

        store.set("bar");
        expect(equalFoo.get()).toBe(false);

        store.set("foo");
        expect(equalFoo.get()).toBe(true);

        expect(events).toEqual([
            { value: true, prev: undefined }, // initial delivery
            { value: false, prev: true },
            { value: true, prev: false }
        ]);

        unsubscribe();
    });

    it("supports boolean comparison", () => {
        const store = new ValueStore<boolean>(true);
        const equalTrue = store.equal(true);

        expect(equalTrue.get()).toBe(true);

        store.set(false as any);
        expect(equalTrue.get()).toBe(false);

        store.set(true as any);
        expect(equalTrue.get()).toBe(true);
    });

    it("supports number comparison", () => {
        const store = new ValueStore<number>(1);
        const equalTwo = store.equal(2);

        expect(equalTwo.get()).toBe(false);

        store.set(2 as any);
        expect(equalTwo.get()).toBe(true);

        store.set(3 as any);
        expect(equalTwo.get()).toBe(false);
    });

    it("accepts a custom predicate function", () => {
        const store = new ValueStore<number>(1);
        const isEven = (value?: number) => (value ?? 0) % 2 === 0;
        const evenObserver = store.equal(isEven);

        expect(evenObserver.get()).toBe(false);

        store.set(2);
        expect(evenObserver.get()).toBe(true);

        store.set(5);
        expect(evenObserver.get()).toBe(false);
    });

    it("disposes the observer when the last subscriber unsubscribes", () => {
        const store = new ValueStore<string>("foo");
        const equalFoo = store.equal("foo");

        const unsubscribe1 = equalFoo.subscribe(() => {});
        const unsubscribe2 = equalFoo.subscribe(() => {});

        expect((equalFoo as any).subscribersLength).toBe(2);
        expect((equalFoo as any).disposed).toBe(false);

        unsubscribe1();
        expect((equalFoo as any).subscribersLength).toBe(1);
        expect((equalFoo as any).disposed).toBe(false);

        unsubscribe2();
        expect((equalFoo as any).subscribersLength).toBe(0);
        expect((equalFoo as any).disposed).toBe(true);
    });
});