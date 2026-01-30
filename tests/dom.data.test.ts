import { create, DOMNode } from "../src/dom";

// filepath: /Users/dexter/Projects/4s/ORE3/starter/packages/zpe-editor/packages/duct-tape/tests/dom.data.test.ts

describe("DOMNode.data", () => {
    test("sets and gets data value", () => {
        const node = create("div");
        const data = { foo: "bar" };

        const result = node.data(data);

        expect(result).toBe(node);
        expect(node.data()).toBe(data);
    });

    test("overwrites existing data value", () => {
        const node = create("div");
        const first = { foo: 1 };
        const second = { foo: 2 };

        node.data(first);
        expect(node.data()).toBe(first);

        node.data(second);
        expect(node.data()).toBe(second);
    });

    test("returns undefined when no data has been set", () => {
        const node = create("div");

        const value = node.data();

        expect(value).toBeUndefined();
    });

    test("data is stored separately per DOMNode instance", () => {
        const nodeA = create("div");
        const nodeB = create("div");

        const dataA = { id: "A" };
        const dataB = { id: "B" };

        nodeA.data(dataA);
        nodeB.data(dataB);

        expect(nodeA.data()).toBe(dataA);
        expect(nodeB.data()).toBe(dataB);
        expect(nodeA.data()).not.toBe(nodeB.data());
    });

    test("can store primitive values as data", () => {
        const node = create("div");

        node.data(42);
        expect(node.data()).toBe(42);

        node.data("hello");
        expect(node.data()).toBe("hello");

        node.data(true);
        expect(node.data()).toBe(true);
    });
});