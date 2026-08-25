import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu";
import { ITreeNode } from "../../shared/allinterface/tree/ITreeControl";

interface ISidebarContainer {
    uniqueName: string; // unique identifier for the control
    isShowSidebar: boolean;
    featureQaList: IMenuItem[];
    selectedNode?: ITreeNode;
    featureId: string;
    handleCloseSidebar: () => void;
    headerText?: string;
    selectedNodeExplorer?: ITreeNode; // for show details of Explorer Node
    subTreeFeatureId?: string;
    fullView?: boolean;
    showPopupSidebar?: boolean;
    selectedMenuFeature?: IMenuItem;
    selectedFeatureQa?: IMenuItem | null;
    treeData?: ITreeNode[] | null; // tree data for the sidebar
    hideSideBarCloseBtn?: boolean; // to hide sidebar close button
    isHideMaximizeButton?: boolean;
    handleReloadTree?: (featureId: string, entID?: string) => void;
    handleMouse?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any) => void; // to handle mouse events
    apValueChange?: (value: any, EntID: string, event: unknown, selectedData: unknown, instanceName?: string) => void; // ap form value change
    handleShowErrorDialog?: (message: string, isOpen: boolean) => void;
}

export type { ISidebarContainer };
