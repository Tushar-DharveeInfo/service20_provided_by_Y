
const FnGetCssVariable = (
    name: string,
    fallbackValue: string = "unset"
): string => {
    try {
        if (!name || typeof name !== "string" || !name.length) {
            return fallbackValue;
        }

        const variableName = name.startsWith("--")
            ? name
            : `--${name}`;

        const rootElement = document?.documentElement;

        if (!rootElement) {
            return fallbackValue;
        }

        const value = getComputedStyle(rootElement)
            ?.getPropertyValue(variableName)
            ?.trim();

        return value || fallbackValue;
    } catch (error) {
        console.error("FnGetCssVariable error:", error);
        return fallbackValue;
    }
};

export { FnGetCssVariable };