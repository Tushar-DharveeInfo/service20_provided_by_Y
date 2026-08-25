import './SidebarContainer.css';
import { Sidebar } from "../../shared/sidebar/Sidebar";
import { handleContainerKeyDown } from '../../shared/allcommon/basic/FnHandleContainerKeyDown';
import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu';
import { ITreeNode } from '../../shared/allinterface/entity/ITreeNode';

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
const SidebarContainer = (sidebarContainerProps: ISidebarContainer) => {
  return (
    <div key={sidebarContainerProps.uniqueName} className="nz-sidebar-with-notification" tabIndex={1} onKeyDown={handleContainerKeyDown}>
      <Sidebar
        uniqueName={`${sidebarContainerProps.uniqueName}-sidebar`}
        featureQAList={sidebarContainerProps.featureQaList}
        headerText={sidebarContainerProps.selectedNode?.Name ?? sidebarContainerProps.selectedNode?.Label ?? sidebarContainerProps.headerText}
        isShowNotification={false}
        selectedNodeEntID={sidebarContainerProps.selectedNode?.NodeEntID || sidebarContainerProps.selectedNode?._Feature}
        selectedNode={sidebarContainerProps.selectedNode}
        isShowSidebar={sidebarContainerProps.isShowSidebar}
        handleCloseSidebar={() => {
          sidebarContainerProps.handleCloseSidebar();
        }}
        selectedFeatureQa={sidebarContainerProps.selectedFeatureQa}
        featureId={sidebarContainerProps.featureId}
        fullView={sidebarContainerProps.fullView}
        showPopupSidebar={sidebarContainerProps.showPopupSidebar}
        selectedMenuFeature={sidebarContainerProps.selectedMenuFeature}
        subTreeFeatureId={sidebarContainerProps.subTreeFeatureId}
        treeData={sidebarContainerProps.treeData}
        isHideMaximizeButton={sidebarContainerProps.isHideMaximizeButton}
        selectedNodeExplorer={sidebarContainerProps.selectedNodeExplorer}
        hideSideBarCloseBtn={sidebarContainerProps.hideSideBarCloseBtn}
        handleReloadTree={sidebarContainerProps.handleReloadTree}
        handleMouse={sidebarContainerProps.handleMouse}
        apValueChange={sidebarContainerProps.apValueChange}
        handleShowErrorDialog={sidebarContainerProps.handleShowErrorDialog}
      />
    </div>
  );
};

export { SidebarContainer };
