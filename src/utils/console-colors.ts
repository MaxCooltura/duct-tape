/* console-colors.ts
   Minimalna biblioteka do kolorowania logów w konsoli przeglądarki (%c + CSS)
*/

// Przykład użycia:
// --------------------------------------------------------------
// import { createLogger, tagged } from "./console-colors";

// const log = createLogger({ namespace: "GAME", minLevel: "debug" });

// log.info("Start", { build: 123 });
// log.warn("Cache miss", "player=42");
// log.error("Boom", new Error("kaput"));

// log.groupCollapsed("Matchmaking");
// log.info("queue size:", 17);
// log.groupEnd();

// log.time("fetch");
// await fetch("/api/ping");
// log.timeEnd("fetch");

// // Chipy:
// const chip = log.chip("NET");
// const [chipOn, chipOff] = (log.chip as any).args({ background: "#e0f2fe", color: "#075985" });
// log.info(chip, chipOn, chipOff, "GET /api/top10");


export type LogLevel = "debug" | "info" | "warn" | "error";

export type CSSStyle = Partial<
    Pick<
        CSSStyleDeclaration,
        | "color"
        | "background"
        | "fontWeight"
        | "fontStyle"
        | "textDecoration"
        | "padding"
        | "borderRadius"
        | "border"
        | "fontFamily"
        | "fontSize"
        | "lineHeight"
        | "letterSpacing"
        | "textTransform"
        | "textShadow"
        | "opacity"
    >
> & {
    // pozwól na dowolne właściwości CSS, gdybyś chciał(a) coś egzotycznego
    [k: string]: string | undefined;
};

export interface Theme {
    level: Record<LogLevel, CSSStyle>;
    prefix: CSSStyle; // styl dla [ns]
    chip: CSSStyle;   // styl dla "badge"/chip
    metaKey: CSSStyle;
    metaVal: CSSStyle;
}

export interface LoggerOptions {
    namespace?: string;
    enabled?: boolean;
    minLevel?: LogLevel; // loguj poziomy >= minLevel
    theme?: Partial<Theme>;
    // jeśli chcesz w przyszłości dodać np. wysyłkę do remote, łatwo rozszerzysz
}

export interface Logger {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;

    group: (title: string, ...args: unknown[]) => void;
    groupCollapsed: (title: string, ...args: unknown[]) => void;
    groupEnd: () => void;

    time: (label: string) => void;
    timeEnd: (label: string) => void;

    // małe bajery:
    chip: (label: string, style?: CSSStyle) => string; // zwraca format z %c
    meta: (obj: Record<string, unknown>) => void;      // ładny "key=value"
}

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const DEFAULT_THEME: Theme = {
    level: {
        debug: { color: "#6b7280" }, // gray
        info: { color: "#2563eb" },  // blue
        warn: { color: "#d97706" },  // amber
        error: { color: "#dc2626" }, // red
    },
    prefix: {
        color: "#111827",
        background: "#e5e7eb",
        padding: "2px 6px",
        borderRadius: "6px",
        fontWeight: "600",
    },
    chip: {
        color: "#111827",
        background: "#f3f4f6",
        padding: "2px 6px",
        borderRadius: "999px",
        fontWeight: "600",
    },
    metaKey: { color: "#374151", fontWeight: "600" },
    metaVal: { color: "#111827" },
};

function styleToString(style: CSSStyle): string {
    return Object.entries(style)
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v}`)
        .join(";");
}

function mergeTheme(base: Theme, patch?: Partial<Theme>): Theme {
    if (!patch) return base;
    return {
        level: { ...base.level, ...(patch.level ?? {}) } as Theme["level"],
        prefix: { ...base.prefix, ...(patch.prefix ?? {}) },
        chip: { ...base.chip, ...(patch.chip ?? {}) },
        metaKey: { ...base.metaKey, ...(patch.metaKey ?? {}) },
        metaVal: { ...base.metaVal, ...(patch.metaVal ?? {}) },
    };
}

function consoleMethodFor(level: LogLevel): (...a: any[]) => void {
    // debug bywa niewidoczny w niektórych ustawieniach konsoli, ale to OK.
    const c = console as any;
    if (level === "debug" && typeof c.debug === "function") return c.debug.bind(console);
    if (level === "info" && typeof c.info === "function") return c.info.bind(console);
    if (level === "warn" && typeof c.warn === "function") return c.warn.bind(console);
    if (level === "error" && typeof c.error === "function") return c.error.bind(console);
    return console.log.bind(console);
}

function shouldLog(level: LogLevel, enabled: boolean, minLevel: LogLevel): boolean {
    return enabled && LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function fmtPrefix(ns?: string): string {
    return ns ? `%c[${ns}]%c` : "%c%c";
}

export function createLogger(opts: LoggerOptions = {}): Logger {
    const namespace = opts.namespace;
    let enabled = opts.enabled ?? true;
    let minLevel = opts.minLevel ?? "debug";
    const theme = mergeTheme(DEFAULT_THEME, opts.theme);

    const prefixStyle = styleToString(theme.prefix);
    const resetStyle = ""; // reset do domyślnego

    function log(level: LogLevel, args: unknown[]): void {
        if (!shouldLog(level, enabled, minLevel)) return;

        const method = consoleMethodFor(level);
        const levelStyle = styleToString(theme.level[level]);

        // Prefix: [ns] w "chipie", potem reszta w kolorze poziomu (opcjonalnie)
        if (namespace) {
            method(
                `%c[${namespace}]%c`,
                `${prefixStyle};${levelStyle}`,
                resetStyle,
                ...args
            );
        } else {
            method(`%c`, levelStyle, ...args);
        }
    }

    function groupBase(collapsed: boolean, title: string, args: unknown[]): void {
        if (!enabled) return;
        const fn = collapsed ? console.groupCollapsed : console.group;
        const levelStyle = styleToString(theme.level.info);

        if (namespace) {
            fn.call(
                console,
                `%c[${namespace}]%c %c${title}%c`,
                prefixStyle,
                resetStyle,
                levelStyle,
                resetStyle,
                ...args
            );
        } else {
            fn.call(console, `%c${title}%c`, levelStyle, resetStyle, ...args);
        }
    }

    function chip(label: string, style: CSSStyle = {}): string {
        // Użycie: logger.info(logger.chip("NET"), "fetch…", url)
        // Uwaga: chip() zwraca string z %c + reset, a style dopinasz do argumentów logu ręcznie,
        // więc wygodniej jest mieć helper "chipArgs" — ale trzymamy API proste.
        // Poniżej: zwracamy tekst z dwoma %c, a style pobierzesz przez chipStyle().
        return `%c${label}%c`;
    }

    function chipStyle(style: CSSStyle = {}): [string, string] {
        const s = styleToString({ ...theme.chip, ...style });
        return [s, ""];
    }

    // function green(label: string): [string, string, string] {
    //     return [`%c${label}%c`, ...chipStyle({ background: "#d1fae5", color: "#065f46" })];
    // }

    function meta(obj: Record<string, unknown>): void {
        if (!enabled) return;
        const kStyle = styleToString(theme.metaKey);
        const vStyle = styleToString(theme.metaVal);

        const parts: any[] = [];
        const fmt: string[] = [];

        for (const [k, v] of Object.entries(obj)) {
            fmt.push(`%c${k}%c=%c${String(v)}%c`);
            parts.push(kStyle, "", vStyle, "");
        }

        const msg = fmt.join("  ");
        if (namespace) {
            console.log(`%c[${namespace}]%c ${msg}`, prefixStyle, "", ...parts);
        } else {
            console.log(msg, ...parts);
        }
    }

    // Mały trik: do chipów musisz dołączyć style jako argumenty.
    // Dodajemy więc metodę "chipArgs" jako właściwość funkcji chip (TypeScript-friendly).
    (chip as any).args = (style?: CSSStyle) => chipStyle(style);
    // (chip as any).green = green;

    const api: Logger = {
        debug: (...a) => log("debug", a),
        info: (...a) => log("info", a),
        warn: (...a) => log("warn", a),
        error: (...a) => log("error", a),

        group: (t, ...a) => groupBase(false, t, a),
        groupCollapsed: (t, ...a) => groupBase(true, t, a),
        groupEnd: () => console.groupEnd(),

        time: (label) => enabled && console.time(label),
        timeEnd: (label) => enabled && console.timeEnd(label),

        chip: chip as any,
        meta,
    };

    // Dodatkowe sterowanie (nie w typie Logger, ale możesz rzutować gdy chcesz):
    // (api as any).setEnabled = (v: boolean) => (enabled = v);
    // (api as any).setMinLevel = (v: LogLevel) => (minLevel = v);

    return api;
}

/** Opcjonalny helper: szybkie "tagowane" logi */
export function tagged(ns: string, opts?: Omit<LoggerOptions, "namespace">): Logger {
    return createLogger({ ...(opts ?? {}), namespace: ns });
}
