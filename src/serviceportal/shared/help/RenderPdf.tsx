import { useEffect, useState, type CSSProperties } from 'react';
import { useFileDownload } from '@n20a/libfsdb';
import { FlipPdf, type FlipPdfProps } from '@n20a/libflippdf';
import '@n20a/libflippdf/style.css';

/*
How to use:
<RenderPdf bucketName="n20-bucket-01" baseFolder="sm" fileName="/help/eula-service.pdf" />
*/
// Fills its parent so FlipPdf's 100%/100% shell has a size to fill
const pdfViewerStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  height: '100%',
};

const pdfStatusStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#555',
  fontSize: '0.9rem',
  padding: '1.25rem',
};

const pdfErrorStyle: CSSProperties = {
  background: '#2d1414',
  color: '#f48771',
  borderRadius: 4,
  padding: '0.75rem',
  fontSize: '0.78rem',
  overflow: 'auto',
};

export interface IRenderPDf {
  bucketName: string;
  baseFolder: string;
  fileName: string;
  documentTitle?: string;
  tocWidthPercent?: number;
  initialTocItem?: string;
  initialPageNumber?: number;
}

export function RenderPdf({
  bucketName,
  baseFolder,
  fileName,
  documentTitle,
  tocWidthPercent,
  initialTocItem,
  initialPageNumber,
}: IRenderPDf) {
  const { getDownloadUrl, downloading, error } = useFileDownload();
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();
  const storagePath = `${bucketName}/${baseFolder}${fileName}`;

  useEffect(() => {
    let isMounted = true;
    setPdfUrl(undefined);

    async function loadPdfUrl() {
      try {
        const response = await getDownloadUrl(storagePath);
        if (isMounted && response?.downloadUrl) {
          setPdfUrl(response.downloadUrl);
        }
      } catch {
        // error state is already captured by useFileDownload
      }
    }

    void loadPdfUrl();

    return () => {
      isMounted = false;
    };
  }, [storagePath, getDownloadUrl]);

  if (downloading) {
    return <div style={pdfStatusStyle}>Loading…</div>;
  }

  if (!pdfUrl) {
    return (
      <div style={pdfStatusStyle}>
        {error ? (
          <pre style={pdfErrorStyle}>{JSON.stringify(error, null, 2)}</pre>
        ) : (
          'PDF file is not available.'
        )}
      </div>
    );
  }

  const flipPdfProps: FlipPdfProps = {
    pdfUrl,
    documentTitle: documentTitle ?? fileName.split(/[\\/]/).pop() ?? 'Document',
    tocWidthPercent,
    initialTocItem,
    initialPageNumber,
  };

  return (
    <div style={pdfViewerStyle}>
      <FlipPdf {...flipPdfProps} />
    </div>
  );
}
