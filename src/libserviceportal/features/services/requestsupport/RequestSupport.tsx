import { useEffect, useMemo, useState } from 'react';
import { OpenSidebar24x24 } from '@n20a/libicon';
import { Splitter, SplitterPanel, SplitterResizeEndEvent } from 'primereact/splitter';
import { FeatureQARange, ServicesEnums } from '../../../constants/Feature';
import { useCommonVariableContext } from '../../../shared/context/hooks/CommonVariableHooks';
import { useSelectedNodeContext } from '../../../shared/context/hooks/SelectedNodeHooks';
import { useSessionContext } from '../../../shared/context/hooks/SessionHooks';
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks';
import { ISession } from '../../../shared/context/allinterface/ISession';
import { IFeatureItem } from '../../../shared/context/allinterface/IMainApp';
import { IMenuItem } from '../../../shared/allinterface/menu/IMainMenu';
import { ISelectedNodeInfo, ITreeNode } from '../../../shared/allinterface/tree/ITreeControl';
import type { INoteItems } from '../../../shared/allinterface/sidebar/IFqaNotes';
import { Label } from '../../../shared/basic/label/Label';
import { ActionImage } from '../../../shared/basic/actionimage/ActionImage';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { SidebarContainer } from '../../../appcontainer/sidebarcontainer/SidebarContainer';
import { handleContainerKeyDown } from '../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { ContactUsNotes } from '../../appqa/contectus/ContactUs';
import { RequestSupportForm } from './RequestSupportForm';
import '../../../appcontainer/allcss/ExplorerContainer.css';
import './RequestSupport.css';

interface IRequestSupportProps {
    uniqueName?: string;
    headerText?: string;
    featureId?: string;
    selectedNode?: ITreeNode;
    handleCloseSidebar?: () => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
}

const RequestSupport = (props: IRequestSupportProps = {}) => {
    const uniqueName = props.uniqueName ?? 'feature-request-support';
    const rawHeaderText = props.headerText ?? 'Request Support';
    const headerTitle = rawHeaderText.startsWith('[')
        ? rawHeaderText
        : `[Services] ${rawHeaderText}`;
    const featureId = props.featureId ?? ServicesEnums.RequestSupport;

    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo>();
    const [selectedNoteItem, setSelectedNoteItem] = useState<INoteItems | null>(null);
    const [isShowSidebar, setIsShowSidebar] = useState<boolean>(false);
    const [featureQAData, setFeatureQAData] = useState<IFeatureItem[]>([]);
    const [showSidebarFullWidth, setShowSidebarFullWidth] = useState<boolean>(false);
    const [isSidebar, setIsSidebar] = useState<string | undefined>("sidebarOpen");
    const [treeData, setTreeData] = useState<ITreeNode[]>();
    const [selectedKebabMenuExplorer] = useState<IMenuItem>();
    const [isShowSidebarIcon] = useState<boolean>(true);

    const mainAppContext = useMainAppContext();
    const commonVariableContext = useCommonVariableContext();
    const sessionContext = useSessionContext();
    const selectedNodeContext = useSelectedNodeContext();

    const contactUsSelectedNode = useMemo<ITreeNode>(() => ({
        key: 'contact-us',
        NodeEntityname: 'ContactUs',
        NodeEntID: 'CONTACT-US',
        stepNo: 0,
        parentEntID: null,
        NodeState: null,
        Description: 'ContactUs',
        title: 'ContactUs',
        children: [],
        treetype: 'ContactUs',
        Name: 'ContactUs',
        Type: 'ContactUs',
        icon: null,
        HasChildren: 0,
        NodeType: 'ContactUs',
    }), []);

    const activeSelectedNode = props.selectedNode ?? selectedNodeInfo?.node ?? contactUsSelectedNode;

    // Builds sidebar QA tabs from smFeatures (featureRecords) for the selected menu.
    useEffect(() => {
        if (!featureId) {
            setFeatureQAData([]);
            return;
        }

        const featureIdStr = String(featureId);
        const filteredQa = (mainAppContext.featureRecords ?? [])
            .filter((item) => {
                const qaId = Number(item._Feature);
                return (
                    String(item.MenuID) === featureIdStr
                    && Number.isFinite(qaId)
                    && qaId > FeatureQARange.MIN
                    && qaId < FeatureQARange.MAX
                );
            })
            .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
        setFeatureQAData(filteredQa);
    }, [featureId, mainAppContext.featureRecords]);

    // Restore sidebar state from session list on initial mount / session updates.
    useEffect(() => {
        const sidebarVar = sessionContext.SessionList.find((sessionvar) => sessionvar.VariableName === "Sidebar");
        if (sidebarVar && sidebarVar.SessionValue === "1") {
            setIsShowSidebar(true);
            setIsSidebar('sidebarOpen');
        }
    }, [sessionContext.SessionList]);

    // Opens sidebar and persists sidebar-open session flag.
    const handleClickInformation = () => {
        const sidebarVariable: ISession = { VariableContext: "Optional", VariableName: "Sidebar", SessionValue: "1" };
        const hasSidebarVariable = sessionContext.SessionList.some((sessionvar) => sessionvar.VariableName === sidebarVariable.VariableName);
        if (hasSidebarVariable) {
            sessionContext.UpdateRowName(sidebarVariable);
        } else {
            sessionContext.setSessionList([...sessionContext.SessionList, sidebarVariable]);
        }
        setIsShowSidebar(true);
        setIsSidebar('sidebarOpen');
    };

    // Keeps sidebar width aligned with right pane after splitter resize.
    const handleExplorerResizeEnd = (event: SplitterResizeEndEvent) => {
        if (event.sizes) {
            const rightPane = document.querySelector('.nz-layout-with-sidebar-pane') as HTMLElement | null;
            const sidebarDiv = document.querySelector('.nz-info-bar .MuiPaper-root') as HTMLElement | null;
            const sidebarContainer = document.querySelector('.nz-qa-sidebar-container') as HTMLElement | null;
            if (!rightPane || !sidebarContainer) {
                return;
            }
            if (sidebarDiv && sidebarContainer && isShowSidebar && sidebarDiv.offsetWidth > rightPane.offsetWidth) {
                sidebarDiv.style.setProperty("width", `${rightPane.offsetWidth}px`, "important");
                sidebarContainer.style.width = rightPane.offsetWidth + "px";
                commonVariableContext.setSidebarWidth(rightPane.offsetWidth);
            }
            if (showSidebarFullWidth) {
                if (rightPane) {
                    const width = (rightPane as HTMLElement).getBoundingClientRect().width;
                    const sidebarDiv = document.querySelector('.nz-qa-sidebar-container .MuiPaper-root') as HTMLElement | null;
                    sidebarContainer.style.width = width + "px";
                    if (sidebarDiv) {
                        sidebarDiv.style.width = width + "px";
                    }
                }
            }
        }
    };

    return (
        <div key={uniqueName} id="FeatureContainer" className="nz-explorer-container nz-request-support-container" tabIndex={1} onKeyDown={handleContainerKeyDown}>
            <div className="nz-w-100 nz-h-100" style={{ display: "flex", flexDirection: "column" }}>
                <div className="nz-sub-header">
                    <div className="nz-d-flex-row nz-align-center">
                        <Label
                            uniqueName={`${uniqueName}-main-header`}
                            label={headerTitle}
                            fontWeight="600"
                        />
                    </div>
                    {featureQAData?.length && isShowSidebarIcon ? (
                        <ActionImage
                            uniqueName={`${uniqueName}-explorer-tree-info-ai`}
                            image={{
                                uniqueName: `${uniqueName}-explorer-tree-info-image`,
                                source: (
                                    <OpenSidebar24x24
                                        size={FnGetCssVariable('--image-size-2')}
                                        fill="none"
                                        strokeWidth={1}
                                    />
                                ),
                                w: 'var(--image-size-2)',
                                tooltip: "Click to view node details in sidebar",
                                type: "svg"
                            }}
                            w={'var(--node_height)'}
                            h={'var(--node_height)'}
                            actionCode={'information'}
                            handleMouse={handleClickInformation}
                        />
                    ) : null}
                </div>
                <div className="nz-feature-explorer-container">
                    <Splitter className="nz-w-100 nz-h-100" onResizeEnd={handleExplorerResizeEnd} tabIndex={-1}>
                        <SplitterPanel tabIndex={-1} size={50} minSize={20} className="nz-d-flex-column nz-explorer-pane nz-pane-1">
                            <ContactUsNotes
                                uniqueName={`${uniqueName}-notes`}
                                selectedNode={activeSelectedNode}
                                onSelectNote={setSelectedNoteItem}
                                selectedNoteItem={selectedNoteItem}
                            />
                        </SplitterPanel>
                        <SplitterPanel tabIndex={-1} size={50} minSize={20} className="nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane nz-pane-2">
                            <div className="nz-wh-100 " style={{ overflow: 'hidden' }}>
                                <RequestSupportForm
                                    uniqueName={`${uniqueName}-details-form`}
                                    selectedNote={selectedNoteItem}
                                />
                            </div>
                        </SplitterPanel>
                    </Splitter>
                </div>

            </div >
            {activeSelectedNode && isSidebar && featureQAData?.length ? (
                <SidebarContainer
                    uniqueName={`${uniqueName}-sidebar`}
                    isShowSidebar={isShowSidebar}
                    featureQaList={featureQAData ?? []}
                    selectedNode={activeSelectedNode}
                    featureId={featureId}
                    fullView={showSidebarFullWidth}
                    headerText={""}
                    selectedFeatureQa={selectedKebabMenuExplorer ?? null}
                    showPopupSidebar={false}
                    treeData={treeData ?? null}
                    handleCloseSidebar={() => {
                        setIsSidebar('sidebarClose');
                        setIsShowSidebar(false);
                        if (props.handleCloseSidebar) {
                            props.handleCloseSidebar();
                        }
                    }}
                    handleReloadTree={props.handleReloadTree}
                />
            ) : null}
        </div >
    );
};

export { RequestSupport };
export default RequestSupport;
