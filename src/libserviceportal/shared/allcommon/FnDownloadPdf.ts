
const resolvePdfFetchUrl = (pdfUrl: string): string => {
    const trimmedUrl = pdfUrl.trim();

    if (/^(https?:)?\/\//i.test(trimmedUrl)) {
        return trimmedUrl;
    }

    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;
    const normalizedPath = trimmedUrl.replace(/^\/+/, "");

    return `${baseUrl}${normalizedPath}`;
};

/* Fetches a pdf from the given url and triggers a browser download. */
const FnDownloadPdf = async (pdfUrl: string, downloadFileName: string): Promise<void> => {
    const fileName = downloadFileName.trim().toLowerCase().endsWith('.pdf')
        ? downloadFileName.trim()
        : `${downloadFileName.trim()}.pdf`;
    const fetchUrl = resolvePdfFetchUrl(pdfUrl);

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        console.error('FnDownloadPdf: failed to download', fetchUrl, error);

        const link = document.createElement('a');
        link.href = fetchUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export { FnDownloadPdf }
