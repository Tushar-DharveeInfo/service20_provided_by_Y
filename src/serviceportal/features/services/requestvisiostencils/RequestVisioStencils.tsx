import { useEffect, useMemo, useRef, useState } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { ServicesEnums } from '../../../constants/Feature';
import { DeviceModel } from '../devicemodel/DeviceModel';

import { Helptip } from '../../../shared/help/Help';
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks';
import { ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';
import { type IRequestShapeFormData } from '../requestdevicemodels/RequestDeviceModels';
import { RequestShapeFormContainer } from '../requestshapeformcontainer/RequestShapeFormContainer';
import './RequestVisioStencils.css';
import { Label } from '../../../shared/basic/label/Label';
import { useBusinessTickets } from '@n20a/libfsdb';
import type { ITicketDoc } from '@n20a/libfsdb';
import { useServiceDataContext } from '../../../shared/context/hooks/ServiceDataHooks'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks';
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer';
import { DownloadCartPane, type IDownloadCart } from '@n20a/libcart';
import { useDownloadMultipleVssfiles, type IUseDownloadMultipleVssfilesOptions } from '../../../shared/allcommon/DownloadMultipleFiles';
import { useGetStencilName } from '../../../shared/context/hooks/ServiceDataHooks';
import { type IVssDownloadDoc } from '@n20a/libfsdb';

interface IRequest {
    uniqueName?: string;
    featureId?: string;
    helpTipText?: string;
    headerText?: string;
    isShowHelptip?: boolean;
    onRequestClick?: () => void;
    saveSearchCriteria?: (searchText: string, AndOr?: "AND" | "OR", mfg?: string, eqtype?: string, pno?: string) => void;
    onSubmitRequest?: (formData: IRequestShapeFormData) => void | Promise<void>;
}

const DEFAULT_HELP_TIP =
    'Use the **Device Model** pane to browse and search the NetZoom device library for Visio stencil shapes. Request and Download panes will support stencil request workflows.';

/** Minimal explorer node so DeviceModel SearchTab can mount outside an tree. */
const EMPTY_SELECTED_NODE: ITreeNode = {
    key: 'request-visio-stencils-root',
    NodeEntityname: null,
    NodeEntID: null,
    stepNo: 0,
    parentEntID: null,
    NodeState: null,
    Description: null,
    title: 'Request Visio Stencils',
    children: [],
    treetype: 'Feature',
    Name: 'Request Visio Stencils',
    Type: 'Feature',
    icon: null,
    HasChildren: 0,
};

//test file for handling download cart actions; note: spaces in filename are ok aslong as its not being passed in url
//Filename:    'vssfolder-01/avssx/3Ware_3Ware-Chassis-100 IP.vssx'


const RequestVisioStencils = (props: IRequest = {}) => {
    // console.log('props RequestVisioStencils', props)
    const [downloadCart, setDownloadCart] = useState<IDownloadCart[]>([]);
    const [downloadQueue, setDownloadQueue] = useState<string[]>([]);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const rawHeaderText = props.headerText ?? 'Request Visio Stencils';
    const headerTitle = rawHeaderText.startsWith('[')
        ? rawHeaderText
        : `[Services] ${rawHeaderText}`
    const uniqueName = props.uniqueName ?? 'request-visio-stencils';
    const featureId = props.featureId ?? ServicesEnums.RequestVisioStencils;
    const showHelptip = props.isShowHelptip !== false;
    const { onRequestClick } = props;

    const helpTipsContext = useHelpTipContext();
    const mainAppContext = useMainAppContext();
    const getStencilName = useGetStencilName();
    // const serviceDataContext = useServiceDataContext();

    function handleDeleteFromDownloadCart(eqid: string) {
        setDownloadCart((prev) => prev.filter((item) => item.EQID !== eqid));
    }

    function handleAddtoDownloadCart(item: IDownloadCart) {
        const source = item as IDownloadCart & { Filename?: string };

        const stencilName = getStencilName(source.EQID);

        if (!stencilName) {
            setDownloadError(`Stencil name not found for EQID: ${source.EQID}`);
            console.warn('Y-handleAddtoDownloadCart: missing stencil name for EQID', source.EQID);
            return;
        }

        const normalizedItem: IDownloadCart = {
            Mfg: source.Mfg,
            ProdNo: source.ProdNo,
            EQID: source.EQID,
            Filename: `${stencilName}.VSSX`,
        };

        setDownloadError(null);
        setDownloadCart((prev) => {
            const alreadyExists = prev.some(
                (existing) => existing.EQID === normalizedItem.EQID && existing.Filename === normalizedItem.Filename
            );
            return alreadyExists ? prev : [...prev, normalizedItem];
        });
        //   console.log('Y-handleAddtoDownloadCart:\nnormalizedItem Added to download cart:', normalizedItem);
    }

    async function handleDownloadCart() {
        if (downloadCart.length === 0) {
            setDownloadError('No files selected for download.');
            return;
        }

        const fileNames = downloadCart.map((item) => `cvssx/${item.Mfg}/${item.Filename}`);
        // console.log('Download to be initiated for visio stencils files:', downloadCart);
        setDownloadError(null);
        setDownloadQueue(fileNames);
    }

    function handleDeleteFromCart(eqid: string) {
        console.log('Removed download item:', eqid);
    }

    const helpTipText = useMemo(() => {
        if (props.helpTipText) {
            return props.helpTipText;
        }
        const tip = helpTipsContext.helpTipRecords?.find((item) =>
            item.featureid.startsWith(`${featureId}_`)
        );
        return tip?.tip ?? DEFAULT_HELP_TIP;
    }, [props.helpTipText, helpTipsContext.helpTipRecords, featureId]);

    useEffect(() => {
        // console.log('Download cart updated:', downloadCart);
    }, [downloadCart]);

    const handleAfterDownload = (downloadedFiles: string[]) => {
        setDownloadError(null);
        console.log('Y-handleDownloadCart: Successfully downloaded files:', downloadedFiles);

        const bid = mainAppContext?.authSession?.bid ?? null;
        const cid = mainAppContext?.authSession?.cid ?? null;

        //   console.log('Y-handleDownloadCart: Creating activity log:', `${cid} of ${bid} downloaded ${JSON.stringify(downloadedFiles)}`);

        if (cid) {
            // Log the download activity for the user
            try {
                mainAppContext?.createActivityLog?.(`${cid} of ${bid} downloaded ${JSON.stringify(downloadedFiles)} successfully.`);
            }
            catch (logErr) {
                console.error('RequestVisioStencils: createActivityLog failed', logErr);
            }
            // log what was downloaded for auditing purposes
            downloadCart.forEach((item) => {
                console.log('RequestVisioStencils: downloaded item for auditing:', item);
                if (item.Filename && downloadedFiles.includes(item.Filename)) {
                    console.log('RequestVisioStencils: verified downloaded item:', item);
                    // Additional auditing logic can be added here if needed

                    const downloadDoc: IVssDownloadDoc = {
                        bid: bid!,
                        cid: cid!,
                        subsid: "", //mainAppContext?.userInfoAndSubscription?.subscription!,
                        monitorupdated: new Date().toISOString(),
                        monitor: false,
                        eqid: item.EQID,
                        filename: item.Filename,
                        dateused: new Date().toISOString(),
                    };

                    mainAppContext?.createDownloadDoc?.(downloadDoc);
                    console.log('RequestVisioStencils: created download log for auditing:', downloadDoc);

                }
            });






            console.log('RequestVisioStencils: downloaded files for auditing:', downloadedFiles);
        }

        setDownloadCart([]);
        setDownloadQueue([]);
    };

    const downloadOptions: IUseDownloadMultipleVssfilesOptions = {
        bucket: 'n20-bucket-01',
        baseFolder: 'vssfolder-01',
        fileNames: downloadQueue,
        onSuccess: handleAfterDownload,
        onError: (message) => {
            setDownloadError(message);
            setDownloadQueue([]);
            console.error(message);
        },
    };

    useDownloadMultipleVssfiles(downloadOptions);

    return (
        <div className="nz-request-visio-stencils nz-wh-100 nz-d-flex-column" id={uniqueName}>
            <div className="nz-sub-header">
                <div className="nz-d-flex-row nz-align-center">
                    <Label
                        uniqueName={`${uniqueName}-main-header`}
                        label={headerTitle}
                        fontWeight="600"
                    />
                </div>
            </div>
            {showHelptip && (
                <div className="nz-request-visio-helptip-div">
                    <Helptip
                        uniqueName={`${uniqueName}-helptip`}
                        mdString={helpTipText}
                    />
                </div>
            )}
            <div className="nz-request-visio-panes">
                <Splitter
                    tabIndex={-1}
                    className="nz-w-100 nz-h-100 nz-feature-container-splitter"
                    layout="horizontal"
                >
                    <SplitterPanel
                        tabIndex={-1}
                        size={65}
                        minSize={40}
                        className="nz-d-flex-column nz-pane-1 nz-request-visio-pane"
                    >
                        <DeviceModel
                            uniqueName={`${uniqueName}-device-model`}
                            featureId={featureId}
                            selectedNode={EMPTY_SELECTED_NODE}
                            treeData={null}
                            ShowOnlyLibraryRadioB={true}
                            addToDownloadCart={(selecteditem: IDownloadCart) => handleAddtoDownloadCart(selecteditem)}

                            saveSearchCriteria={(searchText, AndOr, mfg, eqtype, pno) => {
                                props.saveSearchCriteria?.(searchText as string, AndOr, mfg, eqtype, pno);
                            }} />
                    </SplitterPanel>

                    <SplitterPanel
                        tabIndex={-1}
                        size={35}
                        minSize={20}
                        className="nz-d-flex-column nz-pane-2 nz-request-visio-pane"
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                            {downloadError && (
                                <div style={{ color: 'red', marginBottom: '8px' }}>
                                    {downloadError}
                                </div>
                            )}
                            <DownloadCartPane
                                thisCart={downloadCart}
                                onDownload={handleDownloadCart}
                                onDeleteFromCart={handleDeleteFromDownloadCart}
                            />
                        </div>
                    </SplitterPanel>


                </Splitter>
            </div>
            <div className="request-button-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', marginTop: 'auto', gap: '6px' }}>
                <label className="request-link-label" style={{ lineHeight: '24px', margin: 0 }}>
                    Can't Find the Device/Stencil you are looking for?
                </label>
                <button className="request-link-btn" onClick={onRequestClick} style={{ height: '24px', lineHeight: '1', padding: '0 8px', backgroundColor: '#ffff99', color: '#333' }}>
                    Request it here
                </button>
            </div>
        </div>
    );
};

// ---------- RequestVisioStencilsContainer ----------

type RenderPage = 'searchPage' | 'requestPage';

const RequestVisioStencilsContainer = (props: IRequest) => {
    const [renderPage, setRenderPage] = useState<RenderPage>('searchPage');
    const [formData, setFormData] = useState<IRequestShapeFormData>({
        searchText: '',
        AndOr: "AND",
        Mfg: '',
        EqType: '',
        ProdNo: '',
        MoreInfo: ''
    });
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');

    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const { authSession, createActivityLog } = mainAppContext;
    const bid = String(authSession?.bid || '0').trim();
    const cid = String(authSession?.cid ?? '').trim();
    const noteby = authSession?.displayName || authSession?.username || 'User';

    const { createTicket } = useBusinessTickets(bid);

    const createActivityLogRef = useRef(createActivityLog);
    useEffect(() => {
        createActivityLogRef.current = createActivityLog;
    }, [createActivityLog]);

    const handleRequestClick = () => {
        setRenderPage('requestPage');
    };

    const handleSubmitRequest = async (data: IRequestShapeFormData) => {
        const mfg = (data.Mfg ?? '').trim();
        const prodno = (data.ProdNo ?? '').trim();
        const moreinfo = (data.MoreInfo ?? '').trim();
        const eqtype = (data.EqType ?? '').trim();

        if (!mfg && !prodno && !moreinfo) {
            setPopupMessage('Please enter Manufacturer, Product Number, or More Information before submitting your request.');
            setPopupOpen(true);
            return;
        }

        const now = new Date().toISOString();
        const ticketid = `ticket_${Date.now()}`;

        const newTicket: ITicketDoc = {
            bid,
            cid: cid || noteby,
            ticketid,
            tickettype: 'Visio Stencils Request',
            subscription: '',
            mfg,
            eqtype,
            prodno,
            moreinfo,
            status: 'Pending',
            daterequested: now,
            datereleased: '',
            lastupdated: now,
            monitorupdated: now,
            monitor: false,
        };

        try {
            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Submitting ticket request...');

            const result = await createTicket(newTicket as unknown as Record<string, unknown>);
            if (result && result.success !== false) {
                try {
                    await createActivityLogRef.current?.(`${cid || noteby} of ${bid} created ticket ${ticketid} successfully.`);
                } catch (logErr) {
                    console.error('RequestVisioStencils: createActivityLog failed', logErr);
                }

                setFormData({
                    searchText: '',
                    AndOr: 'AND',
                    Mfg: '',
                    EqType: '',
                    ProdNo: '',
                    MoreInfo: ''
                });
                setPopupMessage(`Ticket ${ticketid} submitted successfully!`);
                setPopupOpen(true);
            } else {
                console.error('RequestVisioStencils: createTicket failed', result?.error);
                setPopupMessage(`Failed to submit ticket: ${result?.error || result?.message || 'Unknown error'}`);
                setPopupOpen(true);
            }
        } catch (err: any) {
            console.error('RequestVisioStencils: createTicket error', err);
            setPopupMessage(`Failed to submit ticket: ${err?.message || 'Unknown error'}`);
            setPopupOpen(true);
        } finally {
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
    };

    const handleSaveSearchCriteria = (searchText?: string, AndOr?: 'AND' | 'OR', mfg?: string, eqtype?: string, pno?: string): void => {
        if (searchText && typeof searchText === 'string' && searchText.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(searchText);
                const data: IRequestShapeFormData = parsed.formData ?? parsed;
                if (data && (data.Mfg !== undefined || data.ProdNo !== undefined || data.MoreInfo !== undefined)) {
                    void handleSubmitRequest(data);
                    return;
                }
            } catch {
                // Not JSON, continue with normal search criteria
            }
        }
        setFormData({
            searchText: searchText ?? '',
            AndOr: AndOr ?? "AND",
            Mfg: mfg ?? '',
            EqType: eqtype ?? '',
            ProdNo: pno ?? '',
            MoreInfo: ''
        });
    };

    return (
        <div className="nz-wh-100 nz-d-flex-column">
            <div className="nz-wh-100 nz-d-flex-column" style={{ display: renderPage === 'searchPage' ? 'flex' : 'none' }}>
                <RequestVisioStencils
                    {...props}
                    saveSearchCriteria={handleSaveSearchCriteria}
                    onRequestClick={handleRequestClick}
                />
            </div>
            {renderPage === 'requestPage' && (
                <div className="nz-wh-100 nz-d-flex-column">
                    <RequestShapeFormContainer
                        {...props}
                        formData={formData}
                        onSearchClick={handleSaveSearchCriteria}
                        onSubmitRequest={handleSubmitRequest}
                        onBack={() => setRenderPage('searchPage')}
                    />
                </div>
            )}
            <YesNoFormContainer
                isOpen={popupOpen}
                uniqueName="request-visio-stencils-dialog"
                message={popupMessage}
                showOkButton={true}
                handleYesButtonClick={() => setPopupOpen(false)}
                handleNoButtonClick={() => setPopupOpen(false)}
                handleOkButtonClick={() => setPopupOpen(false)}
            />
        </div>
    );
};

export { RequestVisioStencils, RequestVisioStencilsContainer, };
export default RequestVisioStencilsContainer;
