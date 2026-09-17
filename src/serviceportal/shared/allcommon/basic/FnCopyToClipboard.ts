
// This function copies content to clipboard
async function FnCopyToClipboard(stringToCopy: string, title: string | null = null, isExportOnCopy: boolean = false) {
    // Extract unique keys from all objects
    const sanitizeFileName = (fileName: string): string => {
        // Define a regular expression pattern for allowed characters
        const allowedCharacters = /[^a-zA-Z0-9_.-]/g;

        // Replace disallowed characters with an underscore
        return fileName.replace(allowedCharacters, '_');
    };

    try {
        if (isExportOnCopy) {
            const data: Record<string, unknown>[] = JSON.parse(stringToCopy);


            if (data.length === 0) {
                throw new Error("Empty data array");
            }
            let result: Record<string, any> | null = null;
            let maxKeysCount = -1;
            for (const obj of data) {
                const keysCount = Object.keys(obj).length;

                if (keysCount > maxKeysCount) {
                    maxKeysCount = keysCount;
                    result = obj;
                }
                // If equal, do nothing — keep the first one
            }
            if (result) {

                const allKeys: string[] = Array.from(new Set(data.flatMap(item => Object.keys(item))));

                // Reorder the keys based on the first object's keys sequence
                const orderedKeys: string[] = allKeys.sort((a, b) => {
                    const indexOfA = Object.keys(result).indexOf(a);
                    const indexOfB = Object.keys(result).indexOf(b);
                    return indexOfA - indexOfB;
                });

                const csvContent: string = orderedKeys.join(",") + "\n";
                const csvData: string = data.map(item => orderedKeys.map(key => String(item[key] ?? "")).join(",")).join("\n");

                const csvBlob = new Blob([csvContent, csvData], { type: 'text/csv' });
                const csvUrl = URL.createObjectURL(csvBlob);

                // Create a download link
                const fileName = title ? sanitizeFileName(title) : "jsonData";
                const link = document.createElement("a");
                link.setAttribute("href", csvUrl);
                link.setAttribute("download", `${fileName}.csv`);
                document.body.appendChild(link);

                // Trigger the download
                setTimeout(() => {
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(csvUrl);
                }, 100);

            }
        } else {
            await navigator.clipboard.writeText(stringToCopy);
        }
    } catch {
        await navigator.clipboard.writeText(stringToCopy);
    }
}

export { FnCopyToClipboard };
