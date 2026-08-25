async function FnConvertBase64Blob(
    input: string | Blob,
    direction: "toBase64" | "toBlob",
    mimeType: string = "audio/wav"
): Promise<string | Blob> {
    try {
        if (direction === "toBase64") {
            if (!(input instanceof Blob)) {
                throw new Error("FnConvertBase64Blob expected a Blob input for toBase64.");
            }

            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onloadend = () => {
                    const result = reader.result;
                    if (typeof result !== "string") {
                        reject(new Error("FnConvertBase64Blob could not read Blob as a base64 string."));
                        return;
                    }

                    resolve(result.split(",")[1]); // raw base64
                };
                reader.onerror = () => reject(reader.error ?? new Error("FnConvertBase64Blob failed to read Blob."));
                reader.readAsDataURL(input);
            });
        }

        if (typeof input !== "string") {
            throw new Error("FnConvertBase64Blob expected a base64 string input for toBlob.");
        }

        const base64 = input.includes(",")
            ? input.split(",")[1] // strip prefix if present
            : input;

        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    } catch (error) {
        console.error("FnConvertBase64Blob error:", error);
        throw error;
    }
}

export { FnConvertBase64Blob }
