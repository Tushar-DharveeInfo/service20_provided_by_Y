
/* Builds the browser url for a file served from the public folder. */
const FnGetPublicAssetUrl = (fileName: string): string => {
    const assetName = fileName.trim().replace(/^\/+/, "");

    if (/^(https?:)?\/\//i.test(assetName)) {
        return assetName;
    }

    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;

    return `${baseUrl}${assetName}`;
};

export { FnGetPublicAssetUrl };
