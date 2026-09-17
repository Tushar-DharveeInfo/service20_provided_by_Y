const FnGetPrefixedPropertyValue = (
    data: Record<string, any>,
    propertyName: string,
    prefix: string
): any => {
    if (!data || !propertyName) {
        return undefined;
    }

    const normalizedPrefix = prefix.replace(/[^a-zA-Z0-9]/g, "");
    const key = `${normalizedPrefix}_${propertyName}`;

    return Object.prototype.hasOwnProperty.call(data, key)
        ? data[key]
        : undefined;
};

export { FnGetPrefixedPropertyValue };