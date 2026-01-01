import { ValueStore } from "../src/value";

// filepath: /Users/dexter/Projects/4s/ORE3/starter/packages/zpe-editor/packages/duct-tape/tests/value.getset.test.ts

describe("ValueStore get and set", () => {
    it("returns initial primitive value and updates with set", () => {
        const store = new ValueStore<number>(1);

        expect(store.get()).toBe(1);

        store.set(2);
        expect(store.get()).toBe(2);
    });

    it("get returns cloned arrays and set copies new arrays", () => {
        const initial = [1, 2, 3];
        const store = new ValueStore<number[]>(initial);

        const a1 = store.get();
        const a2 = store.get();

        expect(a1).not.toBe(initial);
        expect(a1).not.toBe(a2);
        expect(a1).toEqual(initial);

        a1.push(4);
        expect(store.get()).toEqual([1, 2, 3]);

        const newArr = [4, 5];
        store.set(newArr);
        const a3 = store.get();

        expect(a3).toEqual([4, 5]);
        expect(a3).not.toBe(newArr);
    });

    it("get returns deep-cloned objects", () => {
        const initial = { a: 1, nested: { x: 1 } };
        const store = new ValueStore(initial);

        const o1 = store.get();
        const o2 = store.get();

        expect(o1).not.toBe(initial);
        expect(o1).not.toBe(o2);
        expect(o1).toEqual(initial);

        o1.a = 999;
        (o1.nested as any).x = 999;

        const o3 = store.get();
        expect(o3).toEqual({ a: 1, nested: { x: 1 } });
    });

    it("set merges objects deeply", () => {
        const store = new ValueStore({
            a: 1,
            nested: { x: 1, y: 2 }
        });

        store.set({
            b: 2,
            nested: { y: 3, z: 4 }
        } as any);

        const result = store.get() as {
            a: number;
            b: number;
            nested: { x: number; y: number; z: number };
        };

        expect(result).toEqual({
            a: 1,
            b: 2,
            nested: { x: 1, y: 3, z: 4 }
        });
    });

    it("set updater callback receives current and initial values for objects", () => {
        const initial: Record<string, unknown> = { a: 1, nested: { x: 1 } };
        const store = new ValueStore(initial);

        expect(store.get()).toEqual(initial);

        store.set({ a: 2 });
        expect(store.get()).toEqual({ a: 2, nested: { x: 1 } });

        store.set({ nested: { y: 2 } });
        expect(store.get()).toEqual({ a: 2, nested: { x: 1, y: 2 } });

        store.set({ a: 3, nested: { x: 3 } });
        expect(store.get()).toEqual({ a: 3, nested: { x: 3, y: 2 } });
    });
});