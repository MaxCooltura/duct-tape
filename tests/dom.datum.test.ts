import { create, DOMNode } from "../src/dom";

// filepath: /Users/dexter/Projects/4s/ORE3/starter/packages/zpe-editor/packages/duct-tape/tests/dom.datum.test.ts

describe("DOMNode.datum", () => {
    test("sets and gets datum value", () => {
        const node = create("div");
        const data = { foo: "bar" };

        const result = node.datum(data);

        expect(result).toBe(node);
        expect(node.datum()).toBe(data);
    });

    test("overwrites existing datum value", () => {
        const node = create("div");
        const first = { foo: 1 };
        const second = { foo: 2 };

        node.datum(first);
        expect(node.datum()).toBe(first);

        node.datum(second);
        expect(node.datum()).toBe(second);
    });

    test("returns undefined when no datum has been set", () => {
        const node = create("div");

        const value = node.datum();

        expect(value).toBeUndefined();
    });

    test("datum is stored separately per DOMNode instance", () => {
        const nodeA = create("div");
        const nodeB = create("div");

        const dataA = { id: "A" };
        const dataB = { id: "B" };

        nodeA.datum(dataA);
        nodeB.datum(dataB);

        expect(nodeA.datum()).toBe(dataA);
        expect(nodeB.datum()).toBe(dataB);
        expect(nodeA.datum()).not.toBe(nodeB.datum());
    });

    test("can store primitive values as datum", () => {
        const node = create("div");

        node.datum(42);
        expect(node.datum()).toBe(42);

        node.datum("hello");
        expect(node.datum()).toBe("hello");

        node.datum(true);
        expect(node.datum()).toBe(true);
    });
});