import { Value } from './value';

export function toBoolean(
  value: unknown,
  defaultValue: boolean = false,
): boolean {
  if (value instanceof Value) {
    value = value.get();
  }

  if (typeof value === 'boolean') {
    return value;
  } else if (typeof value === 'string') {
    const v = value.toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') {
      return true;
    } else if (v === 'false' || v === '0' || v === 'no' || v === 'off') {
      return false;
    }
  } else if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
}

export function toNumber(value: unknown, defaultValue: number = 0): number {
  if (value instanceof Value) {
    value = value.get();
  }

  if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'string') {
    const v = parseFloat(value);
    return isNaN(v) ? defaultValue : v;
  } else if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return defaultValue;
}

export function toString(value: unknown, defaultValue: string = ''): string {
  if (value instanceof Value) {
    value = value.get();
  }

  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }

  return defaultValue;
}
