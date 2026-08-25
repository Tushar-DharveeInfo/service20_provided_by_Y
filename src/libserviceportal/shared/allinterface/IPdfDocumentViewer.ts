
interface IPdfDocumentViewer {
    uniqueName: string;//uniqueName for the control and required
    fileName?: string;// file name inside public/privatepdf, or used as download name fallback
    pdfUrl?: string;// absolute cloud/local url; preferred when set
    documentTitle?: string;// title rendered by the pdf viewer header
    headerText?: string;// feature header shown above the viewer
    scale?: number;// render scale, defaults to DefaultPdfScale
    downloadFileName?: string;// saved file name for the download overlay
    hideDownloadIcon?: boolean;// hide the download overlay icon
    pdfSource?: 'local' | 'api';// resolve pdf from local public or call api
}

export type { IPdfDocumentViewer }
