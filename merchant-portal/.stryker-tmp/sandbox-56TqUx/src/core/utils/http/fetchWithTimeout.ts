// @ts-nocheck
export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 10000
): Promise<Response> {
    const controller = new AbortController();
    // Allow an existing signal to override/abort as well if passed (optional hybrid approach)
    // but purely for this helper we own the timeout lifecycle.

    // If init.signal exists, we could use AbortSignal.any() in modern environments, 
    // but for safety in this env we will rely on our controller.

    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(input, {
            ...init,
            signal: controller.signal
        });
        return res;
    } finally {
        clearTimeout(id);
    }
}
