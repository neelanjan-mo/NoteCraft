// src/lib/debounce.ts
export function debounce<A extends unknown[], R>(
    fn: (...args: A) => R,
    wait = 300
) {
    let timer: number | undefined;

    return (...args: A): void => {
        if (timer !== undefined) window.clearTimeout(timer);
        // fire-and-forget; works for sync or async functions
        timer = window.setTimeout(() => {
            void fn(...args);
        }, wait);
    };
}
