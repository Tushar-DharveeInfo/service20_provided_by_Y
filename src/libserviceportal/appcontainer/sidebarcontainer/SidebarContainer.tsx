import '../allcss/SidebarContainer.css';
import { ISidebarContainer } from '../allinterface/ISidebarContainer';
import { Sidebar } from "../../shared/sidebar/Sidebar";
import { handleContainerKeyDown } from '../../shared/allcommon/basic/FnHandleContainerKeyDown';

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
