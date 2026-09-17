import { useEffect, useRef, useState } from 'react'
import { OpenSidebar24x24 } from '@n20a/libicon'
import { Splitter, SplitterPanel, SplitterResizeEndEvent } from 'primereact/splitter'
import { Key } from 'rc-tree/lib/interface'
import './ExplorerContainer.css'
import { FeatureQARange } from '../../constants/Feature'
import { useCommonVariableContext } from '../../shared/context/hooks/CommonVariableHooks'
import { useSelectedNodeContext } from '../../shared/context/hooks/SelectedNodeHooks'
import { useSessionContext } from '../../shared/context/hooks/SessionHooks'
import { ISession } from '../../shared/context/allinterface/ISession'
import { IFeatureItem } from '../../shared/context/allinterface/IMainApp'
import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu'
import { ISelectedNodeInfo, ITreeNode } from '../../shared/allinterface/tree/ITreeControl'

import { Label } from '../../shared/basic/label/Label'
import { ActionImage } from '../../shared/basic/actionimage/ActionImage'
import { FnGetCssVariable } from '../../shared/allcommon/FnGetCssVariable'
import { SidebarContainer } from '../sidebarcontainer/SidebarContainer'
import { FeatureRenderContainer } from '../featurecontainer/FeatureRenderContainer'
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer'

export interface IExplorerContainer {
    uniqueName: string; // unique identifier for the control
    featureId: string;
    featureData: IFeatureItem[];
    allowShowHeader: boolean;
    originalTreeData?: ITreeNode[];
    selectedKebabMenu?: IMenuItem; // for handle kebabmenu to select featureQa
    subTreeFeatureId?: string; // this will be used for second tree in the page to render
    headerText?: string;
    selectedFeatureData?: IMenuItem;
    selectedNodeExplorer?: ISelectedNodeInfo; // for use in sidebar to show properties 
    tabIndex?: string;
    selectedNodeForCustomization?: ITreeNode;
    updateOriginalTreeDataset?: (updatedTreedata: ITreeNode[], expandedKeys: Key[], selectedKeys: Key[], userTreeData: ITreeNode[] | null) => void;
    handleReloadTree?: (featureId: string, entID?: string) => void;
    handleCloseSidebar?: () => void;
    clearCacheTreeData?: () => void;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
    handleShowUserMessage?: (messageText: string, container?: HTMLDivElement, isShowAsPrompt?: boolean) => void;
}

const ExplorerContainer = (explorerContainerProps: IExplorerContainer) => {
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<ISelectedNodeInfo>();
    const [isShowSidebar, setIsShowSidebar] = useState<boolean>(false);
    const [featureQAData, setFeatureQAData] = useState<IFeatureItem[]>();
    const [isSidebar, setIsSidebar] = useState<string | undefined>("sidebarClose");
    const [defaultCheckedKeys, setDefaultCheckedKeys] = useState<Key[]>([]);
    const [manuallyNodeSelected, setManuallyNodeSelected] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [treeData, setTreeData] = useState<ITreeNode[]>();
    const [selectedKebabMenuExplorer] = useState<IMenuItem>();
    const [isShowSidebarIcon] = useState<boolean>(true);

    const commonVariableContext = useCommonVariableContext();
    const sessionContext = useSessionContext();
    const selectedNodeContext = useSelectedNodeContext();

    const originalTreeDataRef = useRef<ITreeNode[]>(explorerContainerProps.originalTreeData);
    const defaultCheckedKeyRef = useRef<Key[]>([]);
    const featureIdRef = useRef(explorerContainerProps.featureId);

    // Clears explorer tree refs when container unmounts.
    useEffect(() => {
        return () => {
            originalTreeDataRef.current = [];
            defaultCheckedKeyRef.current = [];
        };
    }, []);

    // Keeps latest feature id in ref for deferred callbacks.
    useEffect(() => {
        featureIdRef.current = explorerContainerProps.featureId;
        setDefaultCheckedKeys([]);
    }, [explorerContainerProps.featureId]);

    // Opens sidebar when node is selected directly from native tree events.
    useEffect(() => {
        setManuallyNodeSelected(false);
        if (explorerContainerProps.selectedNodeExplorer?.nativeEvent) {
            setIsShowSidebar(true);
            setIsSidebar("sidebarOpen");
        }
    }, [
        explorerContainerProps.selectedNodeExplorer?.nativeEvent,
        explorerContainerProps.selectedNodeExplorer?.node?.NodeType
    ]);

    // Handles tree selection, session updates, and contextual layout/sidebar state.
    const handleNodeSelect = async (
        _selectedKeys: Key[],
        info: ISelectedNodeInfo,
        _expandedKeys: Key[],
        newTreeData?: ITreeNode[],
        _isShowSidebar?: boolean
    ) => {
        if (!explorerContainerProps.subTreeFeatureId) {
            selectedNodeContext.setSelectedNodeExplorer(info.node);
        } else {
            selectedNodeContext.setSelectedNode(info.node);
            setSelectedNodeInfo(info);
        }

        // Open sidebar when this feature has QA tabs in featureData.
        const hasSidebarQa = (explorerContainerProps.featureData ?? []).some((item) => {
            const qaId = Number(item._Feature);
            return (
                String(item.MenuID) === String(explorerContainerProps.featureId) &&
                Number.isFinite(qaId) &&
                qaId > FeatureQARange.MIN &&
                qaId < FeatureQARange.MAX
            );
        });

        // Open sidebar on a user click, not on the tree's first auto-select.
        const isAutoSelection =
            info.event === "auto-select" ||
            info.event === "found-select" ||
            info.event === "auto-select-expand";

        if (!isAutoSelection && (hasSidebarQa || isShowSidebar)) {
            setIsShowSidebar(true);
            setIsSidebar('sidebarOpen');
        }

        if (info.event === "select" || info.nativeEvent) {
            setManuallyNodeSelected(true);
        } else {
            const sidebarVar = sessionContext.SessionList?.find((sessionvar) => sessionvar.VariableName === "Sidebar");
            if (sidebarVar && sidebarVar.SessionValue === "1") {
                setIsShowSidebar(true);
            }
        }

        if (!selectedKebabMenuExplorer) {
            if (info.selected) {
                setTreeData(newTreeData);
                setSelectedNodeInfo(info);
            }
        }
    };

    // Builds sidebar QA tabs from featureRecords for the selected menu.
    useEffect(() => {
        if (!explorerContainerProps.featureId) {
            setFeatureQAData([]);
            return;
        }

        const featureId = String(explorerContainerProps.featureId);
        const filteredQa = (explorerContainerProps.featureData ?? [])
            .filter((item) => {
                const qaId = Number(item._Feature);
                return (
                    String(item.MenuID) === featureId &&
                    Number.isFinite(qaId) &&
                    qaId > FeatureQARange.MIN &&
                    qaId < FeatureQARange.MAX
                );
            })
            .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
        setFeatureQAData(filteredQa);
    }, [explorerContainerProps.featureId, explorerContainerProps.featureData]);

    // Opens sidebar and persists sidebar-open session flag.
    const handleClickInformation = () => {
        const sidebarVariable: ISession = { VariableContext: "Optional", VariableName: "Sidebar", SessionValue: "1" };
        const hasSidebarVariable = sessionContext.SessionList?.some((sessionvar) => sessionvar.VariableName === sidebarVariable.VariableName);
        if (hasSidebarVariable) {
            sessionContext.UpdateRowName(sidebarVariable);
        } else {
            sessionContext.setSessionList([...sessionContext.SessionList, sidebarVariable]);
        }
        const explorerNode = selectedNodeContext.selectedNodeExplorer ?? selectedNodeContext.selectedNode;
        if (!selectedNodeInfo?.node && explorerNode) {
            setSelectedNodeInfo({
                event: "select",
                selected: true,
                node: explorerNode,
                selectedNodes: [explorerNode],
            });
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
        }
    };

    const updateOriginalTreeDataset = async (
        updatedTreedata: ITreeNode[],
        expandedKeys: Key[],
        selectedKeys: Key[],
        userTreeData: ITreeNode[] | null
    ) => {
        if (explorerContainerProps.updateOriginalTreeDataset) {
            explorerContainerProps.updateOriginalTreeDataset(updatedTreedata, expandedKeys, selectedKeys, userTreeData);
        }
    };

    void defaultCheckedKeys;
    void handleNodeSelect;
    void updateOriginalTreeDataset;

    return (
        <div key={explorerContainerProps.uniqueName} id="FeatureContainer" className="nz-explorer-container">
            <div className="nz-feature-explorer-container">
                <Splitter className="nz-w-100 nz-h-100" onResizeEnd={handleExplorerResizeEnd} tabIndex={-1}>
                    <SplitterPanel
                        tabIndex={-1}
                        size={25}
                        minSize={10}
                        className={`nz-d-flex-column nz-justify-center nz-explorer-pane${!explorerContainerProps.subTreeFeatureId ? " nz-dc-explorer-pane nz-exp-pane" : " nz-pane-1"}`}
                    >
                        {explorerContainerProps.allowShowHeader && (
                            <div className="nz-sub-header nz-d-flex-row nz-align-center nz-justify-between nz-explorer-header">
                                <Label
                                    uniqueName={explorerContainerProps.uniqueName + "header"}
                                    label={explorerContainerProps.headerText ?? ""}
                                    fontWeight="bold"
                                />
                            </div>
                        )}
                        {/* Left Pane (explorer) render container */}
                        <div className="nz-wh-100 nz-d-flex-column nz-explorer-tree-content">
                            {/* Tree / Explorer will be rendered here for explorer features */}
                        </div>
                    </SplitterPanel>

                    <SplitterPanel
                        tabIndex={-1}
                        size={75}
                        minSize={10}
                        className={`nz-d-flex-column nz-align-center nz-layout-with-sidebar-pane${!explorerContainerProps.subTreeFeatureId ? " nz-pane-1" : " nz-pane-2"}`}
                    >
                        <div className="nz-h-40-px nz-d-flex-row nz-align-center nz-justify-between nz-sub-header nz-w-100">
                            <div className="nz-d-flex-row nz-align-center nz-w-100">
                                <div className="nz-fq-container-header">
                                    <Label
                                        uniqueName={`${explorerContainerProps.uniqueName}-fqa-container`}
                                        label={
                                            selectedNodeInfo?.node
                                                ? `${selectedNodeInfo.node.NodeType ?? ""}: ${selectedNodeInfo.node.Name ?? ""}`
                                                : explorerContainerProps.headerText ?? "Layout"
                                        }
                                    />
                                </div>
                            </div>
                            {Boolean(featureQAData?.length && isShowSidebarIcon) && (
                                <ActionImage
                                    uniqueName={`${explorerContainerProps.uniqueName}-explorer-tree-info-ai`}
                                    image={{
                                        uniqueName: `${explorerContainerProps.uniqueName}-explorer-tree-info-image`,
                                        source: (
                                            <OpenSidebar24x24
                                                size={FnGetCssVariable('--image-size-2') || "24px"}
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
                            )}
                        </div>

                        {/* Right Pane render container */}
                        <div className="nz-wh-100 nz-d-flex-hv-left nz-feature-explorer-right-pane" style={{ overflow: 'hidden' }}>
                            <FeatureRenderContainer
                                key={explorerContainerProps.featureId}
                                doNotRenderExplorerTree={true}
                                allowFeatureToRender={true}
                                asRightPane={true}
                                selectedNode={selectedNodeInfo?.node}
                                treeData={treeData}
                                featureContainerProps={{
                                    uniqueName: explorerContainerProps.uniqueName,
                                    featureId: explorerContainerProps.featureId,
                                    allowShowHeader: explorerContainerProps.allowShowHeader,
                                    headerText: explorerContainerProps.headerText,
                                    selectedFeatureData: explorerContainerProps.selectedFeatureData,
                                    updateStatusBarData: explorerContainerProps.updateStatusBarData,
                                }}
                                handleShowUserMessage={explorerContainerProps.handleShowUserMessage ?? (() => undefined)}
                            />
                        </div>
                    </SplitterPanel>
                </Splitter>

                {/* Sidebar render container */}
                {(explorerContainerProps.selectedNodeExplorer || selectedNodeInfo?.node || selectedNodeContext.selectedNodeExplorer) &&
                    isSidebar === "sidebarOpen" &&
                    Boolean(featureQAData?.length) && (
                        <SidebarContainer
                            uniqueName={`${explorerContainerProps.uniqueName}-sidebar`}
                            isShowSidebar={isShowSidebar}
                            featureQaList={(featureQAData as unknown as IMenuItem[]) ?? []}
                            selectedNode={
                                explorerContainerProps.subTreeFeatureId
                                    ? explorerContainerProps.selectedNodeExplorer && !manuallyNodeSelected
                                        ? explorerContainerProps.selectedNodeExplorer.node
                                        : selectedNodeInfo?.node ?? selectedNodeContext.selectedNodeExplorer
                                    : selectedNodeInfo?.node ?? selectedNodeContext.selectedNodeExplorer
                            }
                            featureId={explorerContainerProps.featureId}
                            subTreeFeatureId={explorerContainerProps.subTreeFeatureId}
                            headerText={""}
                            selectedFeatureQa={selectedKebabMenuExplorer ?? null}
                            showPopupSidebar={false}
                            selectedMenuFeature={explorerContainerProps.selectedFeatureData}
                            treeData={treeData ?? undefined}
                            handleCloseSidebar={() => {
                                setIsSidebar('sidebarClose');
                                setIsShowSidebar(false);
                                if (explorerContainerProps.handleCloseSidebar) {
                                    explorerContainerProps.handleCloseSidebar();
                                }
                            }}
                            handleReloadTree={explorerContainerProps.handleReloadTree}
                        />
                    )}
            </div>

            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'appqatask-confirm'}
                message={confirmMessage}
                handleNoButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }}
                handleOkButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }}
            />
        </div>
    );
};

export { ExplorerContainer };
