
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMainAppContext } from '../context/hooks/MainAppHooks'
import { useCommonVariableContext } from '../context/hooks/CommonVariableHooks'
import { useStatusBarContext } from '../context/hooks/StatusBarHooks'
import './SidebarContent.css'
import { SidebarEnum } from '../../constants/Feature'
import { ITreeNode } from '../allinterface/tree/ITreeControl'
import { IErrorData } from '../allinterface/IApiResponse'
import { IMenuItem } from '../allinterface/menu/IMainMenu'

interface ISidebarContent {
    Label: string;
    uniqueName: string; // A unique identifier for notes
    featureId: string;
    selectedNode: ITreeNode; // selected node data
    subTreeFeatureId?: string; // to handle custom logic 
    selectedNodeMenu?: IMenuItem | undefined; // select nodemenu data
    treeData?: ITreeNode[] | null; // tree data for the sidebar
    selectedNodeExplorer?: ITreeNode;
    isPropertyFound?: boolean; // to check property tab is available or not
    handleReloadTree?: (featureId: string, entID?: string) => void;
    apValueChange?: (value: any, EntID: string, event: unknown, selectedData: unknown, instanceName?: string) => void; // ap form value change
    handleShowErrorDialog?: (message: string, isOpen: boolean) => void;
}

// import { DeviceModel } from './devicemodel/DeviceModel'
import { ForensicLog } from '../../features/profile/myactivities/forensiclog/ForensicLog'
// import { DiagnosticLogContainer } from './diagnosticlogcontainer/DiagnosticLogContainer'
import { FqaNotes } from './notes/FqaNotes'
import { Key } from 'rc-tree/lib/interface'
import { PropertyFormContainer } from './propertyformcontainer/PropertyFormContainer'
import { useHelpTipContext } from '../context/hooks/HelptipHooks'
// import { Assign } from './assign/Assign'
import { AlertLog } from './alertlog/AlertLog'
import { buildPropertyFormDataFromSelectedNode } from '../allcommon/sidebar/FnBuildPropertyFormDataFromSelectedNode'
import { FnIsRootBusinessNode } from '../allcommon/tree/FnIsRootBusinessNode'
import { Label as LabelComponent } from '../basic/label/Label'


const SidebarContent = (sidebarProps: ISidebarContent) => {
    const [Label, setLabel] = useState<string>("");
    const [selectedNode, setSelectedNode] = useState<ITreeNode>();
    const [actionlog, setActionlog] = useState<IErrorData[]>();
    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

    const mainAppContext = useMainAppContext();
    const commonVariableContext = useCommonVariableContext();
    const statusBarContext = useStatusBarContext();
    const helpTipsContext = useHelpTipContext();

    const lastSelectedNodeKeyRef = useRef<Key>(undefined);


    // Initialize form controls and entity information based on selected sidebar action.
    useEffect(() => {
        if (sidebarProps.Label) {
            setLabel(sidebarProps.Label)
        }

    }, [sidebarProps.Label, sidebarProps.featureId, helpTipsContext.helpTipRecords, mainAppContext.emRecords])

    // Update selected node state and determine readonly mode when node selection changes.
    useEffect(() => {
        if (sidebarProps.selectedNode) {
            if (lastSelectedNodeKeyRef.current !== sidebarProps.selectedNode.key) {
                setActionlog([]);
            }

            setIsReadOnly(false)
            setSelectedNode(sidebarProps.selectedNode)
            lastSelectedNodeKeyRef.current = sidebarProps.selectedNode.key;
        }
    }, [sidebarProps.selectedNode]);

    // Append action log entries and location details whenever new log data arrives.
    useEffect(() => {
        const newData = statusBarContext.actionLogData;
        if (!newData?.length) return;

        const existingLog: IErrorData[] = actionlog ?? [];



        const locationData = null

        // Find max id in O(n)
        let lastId = 0;
        for (const item of existingLog) {
            if (item.id != null && item.id > lastId) lastId = item.id;
        }

        // Sort incoming once (desc)
        const incoming = newData.slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

        const result: IErrorData[] = [];

        //  ADD location row (use latest incoming row as base)
        if (locationData && incoming.length > 0) {
            const base = incoming[0];

            result.push({
                ...base,
                errString:
                    typeof locationData === "string"
                        ? locationData
                        : JSON.stringify(locationData),
                id: ++lastId
            });
        }

        // Add incoming rows
        for (const item of incoming) {
            result.push({
                ...item,
                id: ++lastId
            });
        }

        // Append existing log
        for (const item of existingLog) {
            result.push(item);
        }

        setActionlog(result);
    }, [statusBarContext.actionLogData, sidebarProps.featureId]);



    // SAMPLE DATA: build EditTextControl property form from selected-node key/value record.
    const propertyFormPackage = useMemo(() => {
        if (!selectedNode || FnIsRootBusinessNode(selectedNode)) {
            return undefined;
        }
        return buildPropertyFormDataFromSelectedNode(selectedNode);
    }, [
        selectedNode?.key,
        selectedNode?.NodeEntID,
        selectedNode?.EntID,
        selectedNode?.Name,
        selectedNode?.Description,
        selectedNode?.NodeEntityname,
        selectedNode?.NodeType,
        selectedNode?.Type,
        selectedNode?.bname,
        selectedNode?.bid,
        selectedNode?.cid,
        selectedNode?.status,
        selectedNode?.verified,
        selectedNode?.salesExec,
        selectedNode?.country,
        selectedNode?.state,
        selectedNode?.daysNoticePeriod,
        selectedNode?.mmFinYear,
        selectedNode?.relatedBids,
        selectedNode?.contact,
        selectedNode?.email,
        selectedNode?.phone1,
        selectedNode?.phone2,
        selectedNode?.address_street,
        selectedNode?.address_city,
        selectedNode?.address_state,
        selectedNode?.address_zip,
        selectedNode?.address_country,
        selectedNode?.dateCreated,
        selectedNode?.dateUpdated,
    ]);

    const renderPropertyContainer = () => {
        if (selectedNode && FnIsRootBusinessNode(selectedNode)) {
            return (
                <div
                    className="nz-wh-100 nz-d-flex-hv-center"
                    style={{
                        padding: 'var(--spacing-3)',
                        textAlign: 'center',
                        color: 'var(--text-color-secondary, #757575)'
                    }}
                >
                    <LabelComponent
                        uniqueName={`${sidebarProps.uniqueName}-root-message`}
                        label="Select a component node to view details."
                    />
                </div>
            );
        }

        const shouldShowPropertyContainer =
            selectedNode &&
            (sidebarProps.isPropertyFound || Label === "Details") &&
            (Label === SidebarEnum.Property || Label === SidebarEnum.Profile || Label === "Details") &&
            !selectedNode.NodeType?.toLowerCase().includes("helptip");

        if (!shouldShowPropertyContainer || !propertyFormPackage) {
            return null;
        }

        return (
            <div
                style={{
                    height: "100%",
                    width: "100%"
                }}
            >
                <PropertyFormContainer
                    uniqueName={`property-container-${sidebarProps.Label}`}
                    treeData={sidebarProps.treeData ?? undefined}
                    featureId={sidebarProps.featureId}
                    subTreeFeatureId={sidebarProps.subTreeFeatureId}
                    selectedNode={selectedNode}
                    isReadOnly={isReadOnly}
                    isAllowCustomAction={false}
                    selectedNodeMenu={sidebarProps.selectedNodeMenu}
                    entityTables={propertyFormPackage.entityTables}
                    // kebabMenuData={propertyFormPackage.kebabMenuData}
                    handleValueChange={sidebarProps.apValueChange}
                    handleRefreshUpdatedRecord={(
                        newAddedId: string,
                        newAddedName: string,
                        action?: "save" | "back"
                    ) => {
                        if (
                            newAddedId &&
                            action === "save" &&
                            !sidebarProps.subTreeFeatureId
                        ) {
                            commonVariableContext.setReloadTreeFor({
                                featureId: sidebarProps.featureId,
                                entId: newAddedId
                            });
                        } else {
                            sidebarProps.handleReloadTree?.(
                                sidebarProps.featureId,
                                newAddedId
                            );
                        }
                    }}
                />
            </div>
        );
    };

    // Render sidebar content based on selected sidebar tab.
    const renderSidebarContent = () => {
        if (selectedNode && FnIsRootBusinessNode(selectedNode)) {
            return null;
        }
        switch (Label) {
            case SidebarEnum.Alerts:
                return (
                    <AlertLog
                        uniqueName="appqa-alerts"
                        headerText='Alert Log'
                        selectedNode={selectedNode}
                    />
                );

            case SidebarEnum.Log:
                return (
                    <ForensicLog
                        featureId={sidebarProps.featureId}
                        isSetting={true}
                        loginType="node"
                        selectedNode={selectedNode}
                        uniqueName={`${Label}-forensic-log`}
                    />
                );

            case SidebarEnum.Notes:
                return (
                    <FqaNotes
                        uniqueName="Notes"
                        hideSearchControl={false}
                        selectedNode={sidebarProps.selectedNode}
                    />
                );


            default:
                return null;
        }
    };


    return (
        <div className="nz-sidebar-container">
            {renderPropertyContainer()}
            {renderSidebarContent()}
        </div>
    );

}

export { SidebarContent };
export type { ISidebarContent };
