/**
Takes a string parameter: The filename in format "filename.ext"
Strips everything starting at first '.': Finds the first dot and removes everything from that point onwards
Strips last 3 characters: Removes the last 3 characters from the remaining string
Trims the filename: Removes any leading/trailing whitespace from the final result
Returns the processed string: Or an empty string for any errors
The function handles various error cases:
 
Invalid or non-string input
Filenames shorter than 3 characters (after removing extension)
Any unexpected errors during processing
 
 * Processes a filename by stripping everything from the first dot onwards,
 * removing the last 3 characters, and trimming the result
 * @param filename - The filename in format "filename.ext"
 * @returns The processed string or empty string on error
 */
function FnProcessMfgAcronym(filename: string): string {
    try {
        // Check if filename is valid
        if (!filename || typeof filename !== 'string') {
            return "";
        }

        // Find the first dot to strip everything from that point onwards
        const firstDotIndex = filename.indexOf(".");

        let primaryFilename: string;
        if (firstDotIndex === -1) {
            // No dot found, use the entire filename
            primaryFilename = filename;
        } else {
            // Strip everything starting from the first dot
            primaryFilename = filename.substring(0, firstDotIndex);
        }

        // Check if primary filename has at least 3 characters to remove
        if (primaryFilename.length < 3) {
            return "";
        }

        // Remove the last 3 characters from the primary filename
        const withoutLast3 = primaryFilename.substring(0, primaryFilename.length - 3);

        // Trim the result
        const result = withoutLast3.trim();

        return result;
    } catch {
        // Return empty string for any error
        return "";
    }
}

export { FnProcessMfgAcronym }