
import { useEffect, useState } from 'react'
import { SimplePdfViewer } from '@n20a/libflippdf'
import '@n20a/libflippdf/style.css'
import './PdfDocumentViewer.css'
import { Label } from '../basic/label/Label.tsx'
import { DefaultPdfScale } from '../../features/alldefaultprops/DefaultPropsPrivatePdf.ts'
import { FnGetPrivatePdfUrl } from '../../features/allcommon/FnGetPrivatePdfUrl.ts'
import { PdfDownloadOverlay } from './PdfDownloadOverlay.tsx'
import { Loader } from '../loader/Loader.tsx'

interface IPdfDocumentViewer {
    uniqueName: string; // uniqueName for the control and required
    fileName?: string; // file name inside public/privatepdf, or used as download name fallback
    pdfUrl?: string; // absolute cloud/local url; preferred when set
    documentTitle?: string; // title rendered by the pdf viewer header
    headerText?: string; // feature header shown above the viewer
    scale?: number; // render scale, defaults to DefaultPdfScale
    downloadFileName?: string; // saved file name for the download overlay
    hideDownloadIcon?: boolean; // hide the download overlay icon
    pdfSource?: 'local' | 'api'; // resolve pdf from local public or call api
}

/* Read only pdf host used by EULA and the brochure features.
   SimplePdfViewer is the standard renderer; use FlipPdf (see shared/Help.tsx)
   only when a table of contents is needed. */
const PdfDocumentViewer = (pdfDocumentViewerProps: IPdfDocumentViewer) => {
    const fileName = pdfDocumentViewerProps.fileName?.trim() ?? '';

    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isActive = true;
        setIsLoading(true);

        const resolveUrl = () => {
            try {
                const url = pdfDocumentViewerProps.pdfUrl?.trim()
                    || (fileName ? FnGetPrivatePdfUrl(fileName) : '');
                if (isActive) {
                    setPdfUrl(url);
                }
            } catch (err) {
                console.error("Failed to resolve PDF url:", err);
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        resolveUrl();

        return () => {
            isActive = false;
        };
    }, [fileName, pdfDocumentViewerProps.pdfUrl]);

    const documentTitle = pdfDocumentViewerProps.documentTitle
        ?? pdfDocumentViewerProps.headerText
        ?? (fileName ? fileName.replace(/\.pdf$/i, "") : 'Document');
    const downloadFileName = pdfDocumentViewerProps.downloadFileName
        ?? (fileName ? fileName.split(/[\\/]/).pop() : undefined)
        ?? 'document.pdf';

    if (isLoading) {
        return (
            <div key={pdfDocumentViewerProps.uniqueName} className='nz-pdf-document-viewer' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                <Loader />
            </div>
        );
    }

    if (!pdfUrl) {
        return (
            <div key={pdfDocumentViewerProps.uniqueName} className='nz-pdf-document-viewer'>
                <div className='nz-pdf-document-viewer-content'>No PDF url available.</div>
            </div>
        );
    }

    return (
        <div key={pdfDocumentViewerProps.uniqueName} className='nz-pdf-document-viewer'>
            {pdfDocumentViewerProps.headerText && (
                pdfDocumentViewerProps.hideDownloadIcon
                    ? <div className='nz-sub-header'>
                        <Label
                            uniqueName={`${pdfDocumentViewerProps.uniqueName}-header`}
                            label={pdfDocumentViewerProps.headerText}
                            fontWeight='600' />
                    </div>
                    : <PdfDownloadOverlay
                        uniqueName={`${pdfDocumentViewerProps.uniqueName}-overlay`}
                        headerText={pdfDocumentViewerProps.headerText}
                        pdfUrl={pdfUrl}
                        downloadFileName={downloadFileName} />
            )}
            <div className='nz-pdf-document-viewer-content'>
                <SimplePdfViewer
                    documentTitle={documentTitle}
                    pdfUrl={pdfUrl}
                    scale={pdfDocumentViewerProps.scale ?? DefaultPdfScale} />
            </div>
        </div>
    )
}

export { PdfDocumentViewer }
export type { IPdfDocumentViewer }
export default PdfDocumentViewer
