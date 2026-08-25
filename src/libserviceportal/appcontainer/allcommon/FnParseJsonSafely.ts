type ParseOptions<TFallback = null> = {
    key?: string; // Supports nested keys like "user.name"
    fallback?: TFallback;
    isKeySplit?: boolean;
};

const FnParseJsonSafely = <T = any, TFallback = null>(
    jsonString: string,
    options?: ParseOptions<TFallback>
): T | TFallback => {
    const { key, fallback = null as TFallback } = options || {};

    // Invalid input
    if (typeof jsonString !== "string" || !jsonString.trim()) {
        return fallback;
    }

    try {
        const parsed: unknown = JSON.parse(jsonString);

        // Return full parsed object if no key provided
        if (!key) {
            return parsed as T;
        }

        // Support nested keys using dot notation
        const keys = options?.isKeySplit ? key.split(".") : [key];
        let result: unknown = parsed;

        for (const currentKey of keys) {
            if (
                result !== null &&
                typeof result === "object" &&
                currentKey in (result as Record<string, unknown>)
            ) {
                result = (result as Record<string, unknown>)[currentKey];
            } else {
                return fallback;
            }
        }

        return result as T;
    } catch (error) {
        console.error("FnParseJsonSafely:", error, jsonString);
        return fallback;
    }
};

export { FnParseJsonSafely };