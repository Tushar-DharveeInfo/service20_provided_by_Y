
import { OverlayTab } from '../basic/overlaytab/OverlayTab.tsx'
import { FnDownloadPdf } from '../../features/allcommon/FnDownloadPdf.ts'

interface IPdfDownloadOverlay {
    uniqueName: string;
    headerText: string;
    pdfUrl: string;
    downloadFileName: string;
}

const PdfDownloadOverlay = (pdfDownloadOverlayProps: IPdfDownloadOverlay) => {
    return (
        <OverlayTab
            uniqueName={pdfDownloadOverlayProps.uniqueName}
            headerText={pdfDownloadOverlayProps.headerText}
            tabs={[{
                uniqueName: `${pdfDownloadOverlayProps.uniqueName}-download-tab`,
                label: {
                    uniqueName: `${pdfDownloadOverlayProps.uniqueName}-download-label`,
                    label: 'Download',
                },
                w: '18px',
                actionCode: 'download',
                handleMouse: () => {
                    void FnDownloadPdf(
                        pdfDownloadOverlayProps.pdfUrl,
                        pdfDownloadOverlayProps.downloadFileName
                    );
                },
            }]}
            selectedTabName=''
            tabAlignment='horizontal'
            ShowOnlyIcon={true}
            hideDrager={true}
            disableSelectionKey={['download']}
        />
    );
};

export { PdfDownloadOverlay, type IPdfDownloadOverlay }
export default PdfDownloadOverlay
