
import { useMemo, useState } from 'react';
import { Splitter } from 'primereact/splitter';
import { ServicesEnums } from '../../../constants/Feature';
import { DeviceModel } from '../../../shared/devicemodel/DeviceModel';
import { ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';
import { Helptip } from '../../appqa/help/Help';
import { useHelpTipContext } from '../../../shared/context/hooks/HelptipHooks';
import { RequestShapeFormContainer } from '../requestshapeformcontainer/RequestShapeFormContainer';
import { Label } from '../../../shared/basic/label/Label';
export interface IRequestShapeFormData {
    searchText: string;
    AndOr: "AND" | "OR";
    Mfg: string;
    EqType: string;
    ProdNo: string;
    MoreInfo: string;
}

export interface IRequestShape {
    formData: IRequestShapeFormData;
    uniqueName?: string;
    featureId?: string;
    headerText?: string;
    helpTipText?: string;
    isShowHelptip?: boolean;
    onBack?: () => void;
    onRequestClick?: () => void;
    onSearchClick: (searchText?: string, AndOr?: "AND" | "OR", mfg?: string, eqtype?: string, pno?: string) => void;
}

const DEFAULT_HELP_TIP =
    'Use the **Device Model** pane to browse and search the NetZoom device library for Visio stencil shapes. Request and Download panes will support stencil request workflows.';

/** Minimal explorer node so DeviceModel SearchTab can mount outside an tree. */
const EMPTY_SELECTED_NODE: ITreeNode = {
    key: 'request-device-models-root',
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

const RequestDeviceModels = (props: IRequestShape) => {
    const rawHeaderText = props.headerText ?? 'Request Device Models';
    const headerTitle = rawHeaderText.startsWith('[')
        ? rawHeaderText
        : `[Services] ${rawHeaderText}`
    const uniqueName = props.uniqueName ?? 'request-visio-stencils';
    const featureId = props.featureId ?? ServicesEnums.RequestDeviceModels;
    const showHelptip = props.isShowHelptip !== false;
    const { onRequestClick } = props;
    const helpTipsContext = useHelpTipContext();

    const helpTipText = useMemo(() => {
        if (props.helpTipText) {
            return props.helpTipText;
        }
        const tip = helpTipsContext.helpTipRecords?.find((item) =>
            item.featureid.startsWith(`${featureId}_`)
        );
        return tip?.tip ?? DEFAULT_HELP_TIP;
    }, [props.helpTipText, helpTipsContext.helpTipRecords, featureId]);

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
                    <div
                        tabIndex={-1} style={{ flex: '0 0 40%', minHeight: '20%' }} className="nz-d-flex-column nz-pane-1 nz-request-visio-pane">
                        <DeviceModel
                            uniqueName={`${uniqueName}-device-model`}
                            featureId={featureId}
                            selectedNode={EMPTY_SELECTED_NODE}
                            treeData={null}
                            ShowOnlyLibraryRadioB={true}
                            addToDownloadCart={(mfg, prodno, EQID) => { alert(`mfg: ${mfg}\nprodno: ${prodno}\nEQID: ${EQID}`); }}
                            saveSearchCriteria={props.onSearchClick}
                        />
                    </div>
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


// ---------- RequestDeviceModelsContainer ----------
type RenderPage = 'searchPage' | 'requestPage';
//    saveSearchCriteria?: (searchText: string, AndOr: "AND" | "OR", mfg?: string, eqtype?: string, pno?: string) => void

const RequestDeviceModelsContainer = (props: IRequestShape) => {
    const [renderPage, setRenderPage] = useState<RenderPage>('searchPage');
    const [requestformData, setRequestFormData] = useState<IRequestShape>(props);

    const handleSearchClick = (searchText?: string, AndOr?: "AND" | "OR", mfg?: string, eqtype?: string, pno?: string) => {
        setRequestFormData(prev => ({
            ...prev,
            formData: {
                searchText: searchText ?? '',
                AndOr: AndOr ?? "AND",
                Mfg: mfg ?? '',
                EqType: eqtype ?? '',
                ProdNo: pno ?? '',
                MoreInfo: ''
            }
        }));
    }

    const handleRequestClick = () => {
        //also fetch the form data from the RequestDeviceModels component 

        setRenderPage('requestPage');
    };

    if (renderPage === 'searchPage') {
        return (
            <RequestDeviceModels
                {...props}
                onSearchClick={handleSearchClick}
                onRequestClick={handleRequestClick}
            />
        );
    }

    return (
        <RequestShapeFormContainer
            {...requestformData}
            onSearchClick={handleSearchClick}
            onBack={() => setRenderPage('searchPage')}
        />
    );
};

export { RequestDeviceModels, RequestDeviceModelsContainer };
export default RequestDeviceModelsContainer
