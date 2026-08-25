
/*
 * Convert hex color code to RGB string format
 * Example: #ffffff => "255, 255, 255"
 */
const FnHexToRGB = (hex?: string): string => {
    try {
        if (!hex || typeof hex !== "string") {
            return "0, 0, 0";
        }

        const cleanHex = hex.replace("#", "");

        // Validate 6-digit hex
        if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
            return "0, 0, 0";
        }

        const hexValue = Number(`0x${cleanHex}`);

        const r = (hexValue >> 16) & 0xff;
        const g = (hexValue >> 8) & 0xff;
        const b = hexValue & 0xff;

        return `${r}, ${g}, ${b}`;
    } catch (error) {
        console.error("Error in FnHexToRGB:", error);
        return "0, 0, 0";
    }
};

export { FnHexToRGB };