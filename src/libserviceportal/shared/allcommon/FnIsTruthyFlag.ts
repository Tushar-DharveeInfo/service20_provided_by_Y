/* Parses API boolean flags (0/1, true/false, yes/no) without truthy-string pitfalls. */
const FnIsTruthyFlag = (value: unknown): boolean => {
    if (value === undefined || value === null || value === "") {
        return false;
    }
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value === 1;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "false" || normalized === "0" || normalized === "no") {
            return false;
        }
        if (normalized === "true" || normalized === "1" || normalized === "yes") {
            return true;
        }
        return false;
    }
    return value === 1;
};
export { FnIsTruthyFlag };