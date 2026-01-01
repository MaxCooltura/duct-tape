import { toBoolean, toNumber, toString } from "../src/to";
import { ValueStore } from "../src/value";

// filepath: /Users/dexter/Projects/4s/ORE3/starter/packages/zpe-editor/packages/duct-tape/tests/to.test.ts

describe("toBoolean", () => {
    it("returns boolean values as-is", () => {
        expect(toBoolean(true)).toBe(true);
        expect(toBoolean(false)).toBe(false);
    });

    it("parses truthy string values", () => {
        expect(toBoolean("true")).toBe(true);
        expect(toBoolean("True")).toBe(true);
        expect(toBoolean("1")).toBe(true);
        expect(toBoolean("yes")).toBe(true);
        expect(toBoolean("on")).toBe(true);
    });

    it("parses falsy or unknown string values using default", () => {
        expect(toBoolean("false")).toBe(false);
        expect(toBoolean("0")).toBe(false);
        expect(toBoolean("no")).toBe(false);
        expect(toBoolean("off")).toBe(false);
        expect(toBoolean("random")).toBe(false);
        expect(toBoolean("random", true)).toBe(true);
    });

    it("converts numbers (0 => false, non-zero => true)", () => {
        expect(toBoolean(0)).toBe(false);
        expect(toBoolean(1)).toBe(true);
        expect(toBoolean(-1)).toBe(true);
        expect(toBoolean(42)).toBe(true);
    });

    it("returns default for unsupported types", () => {
        expect(toBoolean(null)).toBe(false);
        expect(toBoolean(undefined)).toBe(false);
        expect(toBoolean({}, true)).toBe(true);
        expect(toBoolean([], true)).toBe(true);
    });

    it("unwraps Value instances", () => {
        expect(toBoolean(new ValueStore(true))).toBe(true);
        expect(toBoolean(new ValueStore("1"))).toBe(true);
        expect(toBoolean(new ValueStore(0))).toBe(false);
        expect(toBoolean(new ValueStore("random"), true)).toBe(true);
    });
});

describe("toNumber", () => {
    it("returns number values as-is", () => {
        expect(toNumber(0)).toBe(0);
        expect(toNumber(42)).toBe(42);
        expect(toNumber(-3.14)).toBe(-3.14);
    });

    it("parses numeric strings", () => {
        expect(toNumber("0")).toBe(0);
        expect(toNumber("42")).toBe(42);
        expect(toNumber("-3.14")).toBe(-3.14);
        expect(toNumber("  10.5  ")).toBe(10.5);
    });

    it("returns default for non-numeric strings", () => {
        expect(toNumber("abc")).toBe(0);
        expect(toNumber("abc", 5)).toBe(5);
        expect(toNumber("", 7)).toBe(7);
    });

    it("converts booleans to numbers", () => {
        expect(toNumber(true)).toBe(1);
        expect(toNumber(false)).toBe(0);
    });

    it("returns default for unsupported types", () => {
        expect(toNumber(null)).toBe(0);
        expect(toNumber(undefined)).toBe(0);
        expect(toNumber({}, 9)).toBe(9);
        expect(toNumber([], 11)).toBe(11);
    });

    it("unwraps Value instances", () => {
        expect(toNumber(new ValueStore(123))).toBe(123);
        expect(toNumber(new ValueStore("5.5"))).toBe(5.5);
        expect(toNumber(new ValueStore("abc"), 8)).toBe(8);
        expect(toNumber(new ValueStore(true))).toBe(1);
    });
});

describe("toString", () => {
    it("returns string values as-is", () => {
        expect(toString("hello")).toBe("hello");
        expect(toString("")).toBe("");
    });

    it("converts numbers to strings", () => {
        expect(toString(0)).toBe("0");
        expect(toString(42)).toBe("42");
        expect(toString(-3.14)).toBe("-3.14");
    });

    it("converts booleans to strings", () => {
        expect(toString(true)).toBe("true");
        expect(toString(false)).toBe("false");
    });

    it("returns default for unsupported types", () => {
        expect(toString(null)).toBe("");
        expect(toString(undefined)).toBe("");
        expect(toString({}, "default")).toBe("default");
        expect(toString([], "arr")).toBe("arr");
    });

    it("unwraps Value instances", () => {
        expect(toString(new ValueStore("inner"))).toBe("inner");
        expect(toString(new ValueStore(123))).toBe("123");
        expect(toString(new ValueStore(false))).toBe("false");
        expect(toString(new ValueStore({}), "obj")).toBe("obj");
    });
});