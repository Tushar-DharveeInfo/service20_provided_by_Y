
// check the source type from source data 
const FnCheckImageSourceType = (source: string) => {

    if (!source || typeof source !== "string") {
        return "invalid";
    }

    // Check for SVG content
    const isSVG = source.trim().includes("<svg") && source.trim().includes("</svg>");
    if (isSVG) {
        return "svg";
    }

    if (source.startsWith("/assets") || source.startsWith("/privateimages"))
        return "uri";

    const rawBase64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
    const trimmed = source.trim();
    if (trimmed.startsWith("data:image/") || (trimmed.length > 100 && rawBase64Pattern.test(trimmed))) {
        return "encrypted";
    }
    // Check if it's a URI (local file or URL)
    try {
        const url = new URL(source);
        if (url.protocol === "http:" || url.protocol === "https:") {
            return "uri";
        }
    } catch (error: unknown) {
        console.error('error occured in URI generation :', error);
        // URL construction fails
    }

    // If it doesn't match SVG or URI, classify as encrypted
    return "encrypted";
}

export { FnCheckImageSourceType }