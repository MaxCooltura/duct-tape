export function isObject(value: unknown): value is object {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof RegExp) &&
        !(value instanceof Date)
    );
}

export function isFunction(value: unknown): value is () => boolean {
    return value instanceof Function;
}

export function isDefined(value: unknown): boolean {
    return value !== undefined;
}

export function hasOwnProperty(value: unknown, name: string): boolean {
    return typeof value === "object" && Object.hasOwn(value as object, name);
}

export function hasOwnFunction(value: unknown, name: string): boolean {
    return isObject(value) && isFunction((value as { [id: string]: unknown })[name]);
}

export function isEmpty(value: unknown): boolean {
    if (value === undefined) return true;
    if (value === "") return true;
    if (value === null) return true;
    if (value === 0) return true;

    return false;
}

export function isTrue(value: unknown): boolean {
    if (value === true) return true;
    if (value === "true") return true;
    if (value === "yes") return true;
    if (value === "on") return true;
    if (value === "t") return true;
    if (value === 1) return true;
    if (value === "1") return true;

    return false;
}

export function isFalse(value: unknown): boolean {
    if (value === false) return true;
    if (value === "false") return true;
    if (value === "no") return true;
    if (value === "off") return true;
    if (value === "f") return true;
    if (value === 0) return true;
    if (value === "0") return true;

    return false;
}

export function mergeDeep(
    target: Record<string, unknown>,
    ...sources: Record<string, unknown>[]
): Record<string, unknown> {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}
