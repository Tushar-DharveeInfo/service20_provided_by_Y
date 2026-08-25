
import { ITreeNode } from "../../allinterface/entity/ITreeNode"

interface ISessionVars {
    diagnosticLevel: string;
    basicRole: string;
}

interface ICommonVariable {
    menuOpenName: string | null,
    measurement: string | null,
    isDcmConsoleLoaded: boolean,
    sidebarWidth: number,
    dragNodeDetails: ITreeNode[] // this will be used to handle drag and drop from node to form
    selectedNodeMenu: any;
    diagnosticLevel?: string,
    reloadTreeFor?: { featureId: string, entId: string, dropNodeEntId?: string };
    searchKeywordForTree?: string;
    isReloadDataForGrid?: string;//grid names 
    cablingHideColumnObject?: { fromPort: boolean, cable: boolean, toDevicePort: boolean }
    sessionVarsForTreeNode?: ISessionVars;
    chartProfile: any | null;
    hideFloorLayout?: boolean;
    setMenuOpenName: (data: string) => void
    setMeasurement: (data: string | null,) => void
    setIsDcmConsoleLoaded: (isLoaded: boolean) => void
    setSidebarWidth: (width: number) => void
    setDragNodeDetails: (dragNodeDetails: ITreeNode[]) => void
    setSelectedNodeMenu: (data: any) => void
    setReloadTreeFor: (data?: { featureId: string, entId: string, dropNodeEntId?: string }) => void
    setSearchKeywordForTree: (searchKeyword?: string) => void
    setCablingHideColumnObject: (hideColumn: { fromPort: boolean, cable: boolean, toDevicePort: boolean }) => void
    setDiagnosticLevel: (diagnosticLevel?: string) => void;
    setIsReloadDataForGrid: (isReloadDataForGrid?: string) => void;
    setSessionVarsForTreeNode: (sessionVarsForTreeNode?: ISessionVars) => void;
    setChartProfile: (chartProfile?: any) => void;
    setHideFloorLayout: (hideFloorLayout?: boolean) => void;
}



export type { ICommonVariable, ISessionVars }