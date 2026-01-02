export function isObject(value) {
    return (typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof RegExp) &&
        !(value instanceof Date));
}
export function isFunction(value) {
    return value instanceof Function;
}
export function isDefined(value) {
    return value !== undefined;
}
export function hasOwnProperty(value, name) {
    return typeof value === "object" && Object.hasOwn(value, name);
}
export function hasOwnFunction(value, name) {
    return isObject(value) && isFunction(value[name]);
}
export function isEmpty(value) {
    if (value === undefined)
        return true;
    if (value === "")
        return true;
    if (value === null)
        return true;
    if (value === 0)
        return true;
    return false;
}
export function isTrue(value) {
    if (value === true)
        return true;
    if (value === "true")
        return true;
    if (value === "yes")
        return true;
    if (value === "on")
        return true;
    if (value === "t")
        return true;
    if (value === 1)
        return true;
    if (value === "1")
        return true;
    return false;
}
export function isFalse(value) {
    if (value === false)
        return true;
    if (value === "false")
        return true;
    if (value === "no")
        return true;
    if (value === "off")
        return true;
    if (value === "f")
        return true;
    if (value === 0)
        return true;
    if (value === "0")
        return true;
    return false;
}
export function mergeDeep(target, ...sources) {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return mergeDeep(target, ...sources);
}
//# sourceMappingURL=common.js.map