
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { handleSidebarKeyDown } from '../allcommon/basic/FnHandleContainerKeyDown';
import { Drawer } from '@mui/material';
import { useCommonVariableContext } from '../context/hooks/CommonVariableHooks';
import { useSessionContext } from '../context/hooks/SessionHooks';
import { useMainAppContext } from '../context/hooks/MainAppHooks';
import './Sidebar.css';
import { Label } from '../basic/label/Label';
import { HideSidebar24x24, Maximize24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../allcommon/FnGetCssVariable';
import { ActionImage } from '../basic/actionimage/ActionImage';
import { SidebarContent } from './SidebarContent';
import { MainMenu } from '../menu/mainmenu/MainMenu';
import { IMenuItem, IMainMenu } from '../allinterface/menu/IMainMenu';
import { ITreeNode } from '../allinterface/tree/ITreeControl';

interface IDevicePropertyInfo {
    selectedMfg: string;
    selectedMfgProdNo: string;
    selectedMfgEQID?: string;
}

interface ISidebar {
    featureId: string;
    uniqueName: string; // unique identifier for the control
    isShowSidebar: boolean; // whether to show sidebar or not
    headerText: string; // header text from selected node 
    isShowNotification: boolean; // whether notification is shown or not
    selectedNodeEntID: string; // selected node entid for API call 
    featureQAList: IMenuItem[]; // list of feature QA items
    handleCloseSidebar: () => void; // to handle close sidebar 
    selectedFeatureQa?: IMenuItem | null; // for set selected data
    selectedRightMouseMenu?: any; // to pass selected rightmouse menu if needed
    selectedNode?: ITreeNode; // selected node data
    fullView?: boolean;
    showPopupSidebar?: boolean;
    selectedMenuFeature?: IMenuItem;
    subTreeFeatureId?: string; // for custom handling 
    treeData?: ITreeNode[] | null; // tree data for the sidebar
    hideSideBarCloseBtn?: boolean; // to hide sidebar close button
    selectedNodeExplorer?: ITreeNode;
    isHideMaximizeButton?: boolean;
    handleReloadTree?: (featureId: string, entID?: string) => void;
    handleMouse?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any) => void; // to handle mouse events
    apValueChange?: (value: any, EntID: string, event: unknown, selectedData: unknown, instanceName?: string) => void; // ap form value change
    handleShowErrorDialog?: (message: string, isOpen: boolean) => void;
}

interface IEMRecord {
    TableName?: string;
    DefaultValue?: string;
    RequiredToAddRecord?: boolean;
    RequiredToUpdateRecord?: boolean;
    DisplayControl?: string;
}

interface IKebabMenuResponse {
    KebabMenu?: IMenuItem[];
}
import { SidebarEnum } from '../../constants/Feature';
import { isEqual } from 'lodash';
import { FnParseJsonSafely } from '../../appcontainer/allcommon/FnParseJsonSafely';
import propertySampleData from '../../../serviceSampledata/sidebar/PropertySampleData.json';

const {
    sampleBusinessPropertyKebabMenuResponse,
    sampleContactPropertyKebabMenuResponse,
    samplePropertyKebabMenuResponse,
} = propertySampleData;
import { FnIsRootBusinessNode } from '../allcommon/tree/FnIsRootBusinessNode';

const SUB_MENU_OPEN_DELAY_MS = 200;

const Sidebar = (sidebarProps: ISidebar) => {
    console.log('sidebarProps', sidebarProps)
    const [actionList, setActionList] = useState<IMainMenu | null>(null);
    const [activeTab, setActiveTab] = useState<string>("");
    const [menuData, setMenuData] = useState<IMenuItem[]>([]);
    const [selectedQa, setSelectedQa] = useState<string>(
        sidebarProps.selectedFeatureQa?.Label ?? ""
    );
    const [selectedNodeInfo, setSelctedNodeInfo] = useState<ITreeNode | null>(null)
    const [showInfoDetail, setShowInfoDetail] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState(0);
    const [isPropertyFound, setIsPropertyFound] = useState(false);
    const [selectedNodeMenu, setSelectedNodeMenu] = useState<IMenuItem | undefined>(undefined);
    const [isShowSubMenu, setIsShowSubMenu] = useState(false);
    const [openPosition, setOpenPosition] = useState<number>(0)
    const [dynamicHeight, setDynamicHeight] = useState<number>(0)
    const [isShowFullViewBtn, setIsShowFullViewBtn] = useState(true)

    const commonVariableContext = useCommonVariableContext();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();

    const maxResizeWidthRef = useRef<number>(0);
    const subMenumenuRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<IMenuItem[] | null>(null);
    const subMenuOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingPropertySubMenuOpenRef = useRef(false);
    const isShowSubMenuRef = useRef(false);

    const isAssignMenuItem = (item?: IMenuItem): boolean => {
        const label = item?.Label?.toLowerCase() ?? "";
        return (
            label === SidebarEnum.Assign.toLowerCase() ||
            label.replace(/\s+/g, "") === "assetassignment"
        );
    };

    const getMenuSelectionValue = (item: IMenuItem): string =>
        item._Feature?.toString?.() ?? item.Label?.toString?.() ?? "";

    const isPropertyLikeSidebarTab = (label?: string): boolean =>
        label === SidebarEnum.Property || label === SidebarEnum.Profile || label === "Details";

    useEffect(() => {
        isShowSubMenuRef.current = isShowSubMenu;
    }, [isShowSubMenu]);

    const setSubMenuVisibility = (visible: boolean): void => {
        isShowSubMenuRef.current = visible;
        setIsShowSubMenu(visible);
    };

    const clearSubMenuOpenTimeout = () => {
        if (subMenuOpenTimeoutRef.current) {
            clearTimeout(subMenuOpenTimeoutRef.current);
            subMenuOpenTimeoutRef.current = null;
        }
    };

    // Resize the sidebar dynamically while dragging with mouse or touch.
    const handleMousemove = useCallback(
        (e: MouseEvent | TouchEvent): void => {
            try {
                let clientX = 0;

                if (e instanceof TouchEvent) {
                    if (!e.touches.length) return;

                    clientX = e.touches[0].clientX;
                } else {
                    clientX = e.clientX;
                }

                const offsetRight =
                    document.body.offsetWidth -
                    (clientX - document.body.offsetLeft);

                const minWidth = 280;

                const sidebarDiv = document.querySelector<HTMLElement>(
                    ".nz-info-bar .MuiPaper-root"
                );

                const sidebarContainer = document.querySelector<HTMLElement>(
                    ".nz-qa-sidebar-container"
                );

                if (
                    offsetRight > minWidth &&
                    offsetRight < maxResizeWidthRef.current &&
                    sidebarDiv &&
                    sidebarContainer
                ) {
                    sidebarDiv.style.setProperty(
                        "width",
                        `${offsetRight}px`,
                        // "important"
                    );

                    sidebarContainer.style.width = `${offsetRight}px`;
                }
            } catch (error) {
                console.error("handleMousemove error:", error);
            }
        },
        []
    );

    // Sync selected node information and reset selected submenu when node changes.
    useEffect(() => {
        if (sidebarProps.selectedNode) {
            setSelctedNodeInfo(sidebarProps.selectedNode)
            setSelectedNodeMenu(undefined)
        }
    }, [sidebarProps.selectedNode, sidebarProps.selectedFeatureQa, sidebarProps.showPopupSidebar])

    // Adjust sidebar visibility and width based on current viewport size.
    useEffect(() => {
        const updateDevice = () => {
            const width = window.innerWidth;
            if (width <= 767) {
                handleButtonActions('close')
            } else if (width <= 1023) {
                handleButtonActions('close')
            } else {
                const dummyEvent = {
                    clientX: window.innerWidth
                } as MouseEvent;
                handleMousemove(dummyEvent);
            }
        };
        updateDevice()
        window.addEventListener('resize', updateDevice);
        return () => {
            window.removeEventListener('resize', updateDevice)
            clearSubMenuOpenTimeout();
            setIsShowSubMenu(false)
        };
    }, []);

    // Finalize sidebar resize, persist width, and clean up drag event listeners.
    const handleMouseup = useCallback(
        (_e: MouseEvent | TouchEvent) => {
            try {
                const mainContainerDiv: HTMLElement | null = document.querySelector('.nz-feature-explorer-container');
                const sidebarContainer: HTMLElement | null = document.querySelector('.nz-qa-sidebar-container');
                const layoutPane: HTMLElement | null = document.querySelector('.nz-layout-with-sidebar-pane');
                const explorerPane: HTMLElement | null = document.querySelector('.nz-explorer-pane');
                if (sidebarContainer) {
                    const sidebarContainerWidth = sidebarContainer.getBoundingClientRect().width;
                    commonVariableContext.setSidebarWidth(sidebarContainerWidth);
                    // Select all AG Grids inside the sidebar only
                    const gridPanelsInSidebar = sidebarContainer.querySelectorAll('.nz-qa-sidebar-container .ag-paging-panel');
                    gridPanelsInSidebar.forEach((panel) => {
                        const recordCount = panel.querySelector('.custom-record-count') as HTMLElement;
                        const summaryPanel = panel.querySelector('.ag-paging-row-summary-panel') as HTMLElement;
                        const width = panel.getBoundingClientRect().width;
                        if (recordCount) {
                            recordCount.style.display = width < 475 ? 'none' : 'inline-block';
                        }
                        if (summaryPanel) {
                            summaryPanel.style.display = width < 375 ? 'none' : 'inline-block';
                        }
                    });
                }
                if (mainContainerDiv && sidebarContainer && layoutPane && explorerPane && sidebarContainer.offsetWidth > layoutPane.offsetWidth) {
                    const mainContainerDivWidth = mainContainerDiv.getBoundingClientRect().width;
                    const sidebarContainerWidth = sidebarContainer.getBoundingClientRect().width;
                    commonVariableContext.setSidebarWidth(sidebarContainerWidth);
                    // Calculate flex-basis for the sidebar pane
                    const flexbasisValue = (sidebarContainerWidth / (mainContainerDivWidth - 4)) * 100 + "%";
                    layoutPane.style.setProperty("flex-basis", `calc(${flexbasisValue} - 0px)`);
                    // Set the explorerPane width as the remaining space
                    const remainingWidth = (mainContainerDivWidth - 4) - sidebarContainerWidth;
                    const explorerFlexBasis = (remainingWidth / (mainContainerDivWidth - 4)) * 100 + "%";
                    explorerPane.style.setProperty("flex-basis", `calc(${explorerFlexBasis} - 0px)`);
                }
                document.removeEventListener("mousemove", handleMousemove, true);
                document.removeEventListener("mouseup", handleMouseup, true);
                document.removeEventListener("touchmove", handleMousemove);
                document.removeEventListener("touchend", handleMouseup, true);
                const element = document.getElementById('dragger');
                if (element) {
                    element.classList?.remove("resizable");
                }
            } catch (error) {
                console.error("error handleMouseup", error)
            }
        }, [handleMousemove]);

    // Initialize sidebar resizing when touch interaction starts on the drag handle.
    const handleTouchStart = useCallback(
        (event: TouchEvent | React.TouchEvent<HTMLDivElement>) => {
            try {
                if (sidebarProps.fullView) return
                // Ensure the event starts only from the sidebar dragger
                if (!(event.target as HTMLElement)?.closest(".nz-qa-sidebar-container")?.querySelector("#dragger")) return;
                const rightPane = document.querySelector('.nz-feature-explorer-container');
                if (rightPane) {
                    maxResizeWidthRef.current = rightPane.getBoundingClientRect().width - 200;
                }
                document.addEventListener("touchmove", handleMousemove, { passive: false });
                document.addEventListener("touchend", handleMouseup, true);
                const element = document.getElementById("dragger");
                if (element) {
                    element.classList.add("resizable");
                }
            } catch (error) {
                console.error("error handleTouchStart", error)
            }
        }, [handleMousemove, handleMouseup]);

    // Calculate and restore sidebar width whenever sidebar visibility changes.
    useEffect(() => {
        setShowInfoDetail(sidebarProps.isShowSidebar);
        if (sidebarProps.isShowSidebar) {
            if (sidebarProps.fullView) {
                setWidhOfSidebarFullWidthOFPane()
            } else {
                if (commonVariableContext.sidebarWidth) {
                    const featureContainerDiv = document.querySelector('.nz-explorer-container');
                    const explorerPaneDiv = document.querySelector('.nz-explorer-pane');
                    if (featureContainerDiv && explorerPaneDiv) {
                        const featureContainerDivWidth = featureContainerDiv.getBoundingClientRect().width;
                        const explorerPaneDivWidth = explorerPaneDiv.getBoundingClientRect().width;
                        if ((commonVariableContext.sidebarWidth + explorerPaneDivWidth) > featureContainerDivWidth) {
                            const layoutSidebarDiv: HTMLElement | null = document.querySelector('.nz-layout-with-sidebar-pane');
                            if (layoutSidebarDiv) {
                                const width = layoutSidebarDiv.getBoundingClientRect().width;
                                if (width > 0) {
                                    setDrawerWidth(width);
                                } else {
                                    setDrawerWidth(window.innerWidth / 4);
                                    commonVariableContext.setSidebarWidth(window.innerWidth / 4);
                                }
                            }
                        } else {
                            setDrawerWidth(commonVariableContext.sidebarWidth);
                        }
                    } else {
                        setDrawerWidth(commonVariableContext.sidebarWidth);
                    }
                } else {
                    setDrawerWidth(window.innerWidth / 4);
                    commonVariableContext.setSidebarWidth(window.innerWidth / 4);
                }
            }
        }
    }, [sidebarProps.isShowSidebar, sidebarProps.fullView, commonVariableContext.sidebarWidth]);

    // Set sidebar width to match the full available layout pane width.
    const setWidhOfSidebarFullWidthOFPane = () => {
        const div: HTMLElement | null = document.querySelector('.nz-layout-with-sidebar-pane')
        if (div) {
            const width = (div as HTMLElement).getBoundingClientRect().width;
            setDrawerWidth(width);
        }
    }

    // Filter sidebar actions, initialize active tab, and register menu event listeners.
    useEffect(() => {
        try {
            if (!sidebarProps.featureQAList) return;
            let filterData: IMenuItem[] = [];
            try {
                if (sidebarProps.selectedNode) {
                    sidebarProps.featureQAList.forEach((item) => {
                        if (sidebarProps.selectedNode &&
                            item?.NodeType &&
                            item.NodeType.toLowerCase().includes(
                                sidebarProps.selectedNode?.NodeType?.toString()?.toLowerCase() ?? ""
                            )
                        ) {
                            filterData.push(item);
                        } else if (item?.NodeType === "+fnAI" || item?.NodeType === "") {
                            filterData.push(item);
                        }
                    });
                } else {
                    filterData = sidebarProps.featureQAList;
                }
            } catch (err) {
                console.error("Filtering error:", err);
            }
            let isSameMenu = false;
            isSameMenu =
                menuRef.current !== null &&
                isEqual(menuRef.current, filterData);
            // ALWAYS run selection logic
            try {
                if (filterData.length) {
                    const propertyQaData = filterData.find(
                        (item) => item?.Label === "Property" || item?.Label === "Profile" || item?.Label === "Details"
                    );
                    const selectDefaultQa = filterData.filter(
                        (item) => item?.DefaultQA === true
                    );
                    const assignQaData = filterData.find(isAssignMenuItem);

                    const findSelectedQa = filterData.find(
                        (item) => item?.Label === activeTab
                    );
                    setIsPropertyFound(!!propertyQaData);
                    if (sidebarProps.selectedFeatureQa) {
                        const value =
                            sidebarProps.selectedFeatureQa?._Feature?.toString?.() ??
                            sidebarProps.selectedFeatureQa?.Label?.toString?.();
                        setActiveTab(sidebarProps.selectedFeatureQa.Label);
                        setSelectedQa(value);
                    } else if (assignQaData) {
                        setSelectedQa(getMenuSelectionValue(assignQaData));
                        setActiveTab(SidebarEnum.Assign);
                    } else if (!activeTab || !findSelectedQa) {
                        if (selectDefaultQa.length) {
                            setSelectedQa(selectDefaultQa[0].Label);
                            setActiveTab(selectDefaultQa[0].Label);
                        } else {
                            const value = filterData[0]?._Feature ? filterData[0]._Feature.toString() : undefined;
                            setSelectedQa(value || "");
                            setActiveTab(filterData[0]?.Label);
                        }
                    }
                }
            } catch (err) {
                console.error("Selection logic error:", err);
            }
            // Only skip menu creation if same
            try {
                if (!isSameMenu) {
                    const sideBarActionList: IMainMenu = {
                        uniqueName: "sidebar-action-image-strip",
                        isVertical: false,
                        w: "100%",
                        h: "24",
                        bgColor: "var(--bg-color-qamenu)",
                        border: "",
                        menuSize: "sm",
                        actionImageW: 24,
                        actionImageH: 24,
                        compact: true,
                        spacing: "0px 2px",
                        isIconVertical: true,
                        hideLabel: true,
                        featureData: filterData,
                    };
                    setActionList(sideBarActionList);
                    menuRef.current = filterData;
                }
            } catch (err) {
                console.error("Menu creation error:", err);
            }
            try {
                document.addEventListener("touchstart", handleTouchStart, {
                    passive: false,
                });
            } catch (err) {
                console.error("touchstart listener error:", err);
            }
            // Close the submenu when clicking outside the submenu container and icon strip.
            const handleClickOutside = (event: MouseEvent) => {
                try {
                    const target = event.target as HTMLElement | null;
                    if (!target || !subMenumenuRef.current) {
                        return;
                    }
                    if (target.closest(".nz-sidebar-strip")) {
                        return;
                    }
                    if (!subMenumenuRef.current.contains(target)) {
                        setIsShowSubMenu(false);
                    }
                } catch (err) {
                    console.error("Click outside error:", err);
                }
            };
            try {
                document.addEventListener("mousedown", handleClickOutside);
            } catch (err) {
                console.error("mousedown listener error:", err);
            }
            return () => {
                try {
                    clearSubMenuOpenTimeout();
                    document.removeEventListener("touchstart", handleTouchStart);
                    document.removeEventListener("mousedown", handleClickOutside);
                } catch (err) {
                    console.error("Cleanup error:", err);
                }
            };
        } catch (error) {
            console.error("useEffect error:", error);
        }
    }, [
        sidebarProps.featureQAList,
        sidebarProps.selectedFeatureQa,
        sidebarProps.selectedNode,
        sidebarProps.isShowSidebar,
        handleTouchStart,
    ]);

    // Load submenu items whenever the active sidebar tab changes.
    useEffect(() => {
        if (showInfoDetail && activeTab) {
            FnSetSubmenu(activeTab)
        }
    }, [showInfoDetail, activeTab, sidebarProps.selectedNode])

    // Start sidebar resize operation when dragging begins with the mouse.
    const handleMousedown = (
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        try {
            // Prevent default safely
            event?.preventDefault?.();
            if (sidebarProps.fullView) return;
            // Ensure event target is valid
            const target = event?.target as HTMLElement | null;
            if (
                !target ||
                !target.closest(".nz-qa-sidebar-container")?.querySelector("#dragger")
            ) {
                return;
            }
            const rightPane = document.querySelector('.nz-feature-explorer-container') as HTMLElement | null;
            if (rightPane) {
                try {
                    maxResizeWidthRef.current =
                        rightPane.getBoundingClientRect().width - 200;
                } catch (err) {
                    console.error("Width calculation error:", err);
                }
            }
            try {
                document.addEventListener("mousemove", handleMousemove, true);
                document.addEventListener("mouseup", handleMouseup, true);
            } catch (err) {
                console.error("Event listener error:", err);
            }
            const element = document.getElementById('dragger') as HTMLElement | null;
            if (element) {
                try {
                    element.classList?.add("resizable");
                } catch (err) {
                    console.error("ClassList error:", err);
                }
            }
        } catch (error) {
            console.error("handleMousedown error:", error);
        }
    };

    // Execute sidebar header actions such as closing the sidebar.
    const handleButtonActions = (
        actionName: "close"
    ) => {
        try {
            if (actionName === "close") {
                setShowInfoDetail(false);
                const sidebarDiv = document.querySelector('.nz-info-bar .MuiPaper-root') as HTMLElement | null;
                const sidebarContainer = document.querySelector('.nz-qa-sidebar-container') as HTMLElement | null;
                if (sidebarDiv && sidebarContainer) {
                    try {
                        sidebarDiv.style.width = "0px";
                        sidebarContainer.style.width = "0px";
                    } catch (err) {
                        console.error("Sidebar style update error:", err);
                    }
                }
                sidebarProps.handleCloseSidebar?.();
                if (!sidebarProps.showPopupSidebar) {
                    // SAMPLE DATA: SESSION.UpdateSession API commented out.
                    // axiosInterceptor({
                    //     url: SESSION.UpdateSession,
                    //     data: {
                    //         jsonSession: JSON.stringify([
                    //             { VariableContext: "Optional", VariableName: "Sidebar", SessionValue: 0 }
                    //         ])
                    //     },
                    //     setFetchData: handleUpdateSessionApiResponse
                    // }, statusBarContext);
                    const updatedSession = sessionContext.SessionList.map((item) =>
                        item.VariableContext === "Optional" && item.VariableName === "Sidebar"
                            ? { ...item, SessionValue: "0" }
                            : item
                    );
                    sessionContext.setSessionList(updatedSession);
                }
                setDrawerWidth(0);
            }
        } catch (error) {
            console.error("handleButtonActions error:", error);
        }
    };

    // set full width for log and alerts
    const setWidthOfSidebarForFqas = () => {

        const featureContainerDiv = document.querySelector('.nz-explorer-container');
        const explorerPaneDiv = document.querySelector('.nz-explorer-pane');
        if (featureContainerDiv && explorerPaneDiv) {
            const featureContainerDivWidth = featureContainerDiv.getBoundingClientRect().width;
            const explorerPaneDivWidth = explorerPaneDiv.getBoundingClientRect().width;
            setDrawerWidth(featureContainerDivWidth - explorerPaneDivWidth)
        } else {
            setDrawerWidth(commonVariableContext.sidebarWidth);
        }
    }

    // Handle sidebar tab selection and update the active QA context.
    const handleMouse = (
        event:
            | React.MouseEvent<HTMLDivElement>
            | React.KeyboardEvent<HTMLDivElement>
            | undefined,
        actionCode?: string,
        payload?: IMenuItem
    ): void => {
        if (payload?.Label) {
            const selectedTabLabel = isAssignMenuItem(payload)
                ? SidebarEnum.Assign
                : payload.Label;
            const isSameTab = selectedTabLabel === activeTab;

            if (!isSameTab) {
                FnSetSubmenu(selectedTabLabel);
            }
            if (payload.Label && !sidebarProps.isHideMaximizeButton && [SidebarEnum.Log.toLowerCase(), SidebarEnum.Alerts.toLowerCase()].includes(payload.Label.toLowerCase())) {
                setIsShowFullViewBtn(false);
                setWidthOfSidebarForFqas()
            }
            else {
                if (isShowFullViewBtn) {
                    setDrawerWidth(commonVariableContext.sidebarWidth ?? window.innerWidth / 4)
                }
            }

            setActiveTab(selectedTabLabel);
            setSelectedQa(actionCode ?? "");

            if (isPropertyLikeSidebarTab(payload.Label)) {
                clearSubMenuOpenTimeout();
                if (isSameTab) {
                    handlePropertySubMenuClick();
                } else {
                    pendingPropertySubMenuOpenRef.current = true;
                    setSubMenuVisibility(false);
                }
            } else {
                pendingPropertySubMenuOpenRef.current = false;
                setSubMenuVisibility(false);
            }
        }

        sidebarProps.handleMouse?.(
            event,
            actionCode,
            payload
        );
    };

    const positionSubMenuPanel = (): void => {
        const div = document.getElementById("nz-sidebar-strip");
        const header = document.querySelector(".nz-sub-header");
        if (div && header) {
            try {
                const heightHeader = (header as HTMLElement).getBoundingClientRect().height;
                setOpenPosition(heightHeader + div.offsetHeight);
            } catch (err) {
                console.error("Header/div calculation error:", err);
            }
        }
        const sidebarContainer = document.querySelector('.nz-sidebar-container');
        if (sidebarContainer) {
            try {
                setDynamicHeight(
                    (sidebarContainer as HTMLElement).getBoundingClientRect().height
                );
            } catch (err) {
                console.error("Sidebar height error:", err);
            }
        }
    };

    const closeSubMenuPanel = (): void => {
        setSubMenuVisibility(false);
    };

    const openPropertySubMenuPanel = (): void => {
        if (menuData.length === 0) {
            pendingPropertySubMenuOpenRef.current = true;
            return;
        }
        pendingPropertySubMenuOpenRef.current = false;
        positionSubMenuPanel();
        setSubMenuVisibility(true);
    };

    const handlePropertySubMenuClick = (): void => {
        clearSubMenuOpenTimeout();
        if (menuData.length === 0) {
            pendingPropertySubMenuOpenRef.current = true;
            return;
        }
        if (isShowSubMenuRef.current) {
            closeSubMenuPanel();
        } else {
            openPropertySubMenuPanel();
        }
    };

    const schedulePropertySubMenuHover = (): void => {
        clearSubMenuOpenTimeout();
        subMenuOpenTimeoutRef.current = setTimeout(() => {
            subMenuOpenTimeoutRef.current = null;
            if (menuData.length === 0) {
                return;
            }
            if (isShowSubMenuRef.current) {
                closeSubMenuPanel();
            } else {
                openPropertySubMenuPanel();
            }
        }, SUB_MENU_OPEN_DELAY_MS);
    };

    // Open property submenu once kebab menu data is available after switching tabs.
    useEffect(() => {
        if (
            pendingPropertySubMenuOpenRef.current &&
            menuData.length > 0 &&
            isPropertyLikeSidebarTab(activeTab)
        ) {
            pendingPropertySubMenuOpenRef.current = false;
            openPropertySubMenuPanel();
        }
    }, [menuData, activeTab]);

    // Close the expandable submenu panel when pointer leaves the menu area.
    const handleMouseMenuImage = (
        event?:
            | MouseEvent
            | React.MouseEvent<HTMLDivElement>
    ) => {
        try {
            if (event?.type === "mouseleave") {
                closeSubMenuPanel();
            }
        } catch (error) {
            console.error("handleMouseMenuImage error:", error);
        }
    };

    // Select a submenu item and switch back to the Property tab.
    function handleSelectNode(
        _value: unknown,
        _actionCode?: string,
        payload?: IMenuItem
    ): void {
        setIsShowSubMenu(false);

        if (payload) {
            setSelectedNodeMenu(payload);
        }

        setActiveTab(SidebarEnum.Property);
    }

    // Display submenu for the currently active sidebar action.
    const handleMouseEnterSubMenu = (
        _event: MouseEvent | undefined,
        _actionCode?: string,
        payload?: IMenuItem
    ) => {
        if (
            payload?.Label === activeTab &&
            isPropertyLikeSidebarTab(payload.Label)
        ) {
            schedulePropertySubMenuHover();
        }
    };

    const handleMouseLeaveSubMenu = () => {
        clearSubMenuOpenTimeout();
    };

    // Fetch and prepare node-specific submenu actions for the Property tab.
    const FnSetSubmenu = async (label: string): Promise<void> => {
        if (
            !isPropertyLikeSidebarTab(label) ||
            !sidebarProps.selectedNode ||
            sidebarProps.selectedNode.NodeType?.toLowerCase() === "alldatacenters" ||
            FnIsRootBusinessNode(sidebarProps.selectedNode)
        ) {
            setMenuData([]);
            return;
        }

        // Process kebab menu response and build filtered submenu items.
        const handleApiGetKebabMenu = (
            data: unknown,
            status?: string
        ): void => {
            try {
                if (status !== "200") {
                    setMenuData([]);
                    return;
                }

                if (
                    typeof data !== "object" ||
                    data === null ||
                    !("kebabJson" in data)
                ) {
                    setMenuData([]);
                    return;
                }

                if (!data.kebabJson) {
                    setMenuData([]);
                    return;
                }

                const parsedData = FnParseJsonSafely(
                    data.kebabJson as string
                );

                if (
                    !parsedData ||
                    typeof parsedData !== "object"
                ) {
                    setMenuData([]);
                    return;
                }

                const nodeData = parsedData as IKebabMenuResponse;

                if (!Array.isArray(nodeData.KebabMenu)) {
                    setMenuData([]);
                    return;
                }


                const menu: IMenuItem[] = [];

                for (const element of nodeData.KebabMenu) {
                    const updatedElement = {
                        ...element,
                        separator: Boolean(
                            (element as Record<string, unknown>)
                                ?.Separator
                        )
                    };

                    const emPgTableRecord =
                        Array.isArray(mainAppContext?.emRecords)
                            ? mainAppContext.emRecords.find(
                                (item) =>
                                    (item?.TableName ?? "").toLowerCase() ===
                                    ((element as Record<string, unknown>)["Name"] as string ?? "")
                                        .toLowerCase() &&
                                    (item?.DefaultValue ?? "")
                                        .toLowerCase()
                                        .includes("nzf_") &&
                                    !item?.RequiredToAddRecord &&
                                    !item?.RequiredToUpdateRecord &&
                                    item?.DisplayControl !== "TextControl"
                            )
                            : undefined;

                    if (!emPgTableRecord) {
                        menu.push(updatedElement);
                    }
                }

                setMenuData(menu);
            } catch (error) {
                console.error(
                    "handleApiGetKebabMenu error:",
                    error
                );
                setMenuData([]);
            }
        };

        if (!sidebarProps.selectedNode.NodeEntityname) {
            setMenuData([]);
            return;
        }

        // SAMPLE DATA: PROPERTY.GetKebabMenu API commented out.
        // axiosInterceptor(
        //     {
        //         url: PROPERTY.GetKebabMenu,
        //         data: {
        //             selectedNodeEntity: sidebarProps.selectedNode.NodeEntityname,
        //             selectedNodeType: sidebarProps.selectedNode.MountedDeviceID
        //                 ? "Device"
        //                 : sidebarProps.selectedNode.NodeType
        //         },
        //         allowShowLoader: true,
        //         setFetchData: handleApiGetKebabMenu
        //     },
        //     statusBarContext
        // );
        const entityName =
            sidebarProps.selectedNode.NodeEntityname?.toLowerCase() ?? "";
        const kebabMenuResponse =
            entityName === "business"
                ? sampleBusinessPropertyKebabMenuResponse
                : entityName === "contact"
                    ? sampleContactPropertyKebabMenuResponse
                    : samplePropertyKebabMenuResponse;
        handleApiGetKebabMenu(kebabMenuResponse, "200");
    };

    // Refresh tree data and restore the default sidebar tab after updates.
    const handleReloadTree = (featureId: string, entID?: string) => {
        try {
            const qaList = sidebarProps.featureQAList;
            const assignQa = Array.isArray(qaList)
                ? qaList.find(isAssignMenuItem)
                : undefined;
            const selectDefaultQa = Array.isArray(qaList)
                ? qaList.filter((item) => item?.DefaultQA === true)
                : [];
            const selectedFQa = assignQa
                ? assignQa
                : selectDefaultQa.length
                    ? selectDefaultQa[0]
                    : Array.isArray(qaList)
                        ? qaList[0]
                        : undefined;
            if (selectedFQa) {
                const isAssignTab = isAssignMenuItem(selectedFQa);
                setSelectedQa(getMenuSelectionValue(selectedFQa));
                setActiveTab(isAssignTab ? SidebarEnum.Assign : selectedFQa.Label);
                FnSetSubmenu(isAssignTab ? SidebarEnum.Assign : selectedFQa.Label);
            }
            if (typeof sidebarProps.handleReloadTree === "function") {
                try {
                    sidebarProps.handleReloadTree(featureId, entID);
                } catch (err) {
                    console.error("handleReloadTree prop error:", err);
                }
            }
        } catch (error) {
            console.error("handleReloadTree error:", error);
        }
    };

    const focusSidebarStrip = (): void => {
        const stripFocusTarget = document.querySelector<HTMLElement>(
            '#nz-sidebar-strip .nz-scroll-container[tabindex]'
        );
        stripFocusTarget?.focus();
    };

    return (
        <div className={`nz-qa-sidebar-container${sidebarProps.isShowNotification ? " nz-sidebar-with-notification" : ""}`} tabIndex={1} onKeyDown={handleSidebarKeyDown} style={{ width: `${drawerWidth}px` }}>
            <Drawer className={`nz-info-bar ${showInfoDetail ? "nz-info-bar-active" : ""}`}
                anchor={'right'}
                sx={{
                    "& .MuiPaper-root": {
                        width: `${drawerWidth}px `
                    }
                }}
                hideBackdrop={true}
                variant='permanent'
                transitionDuration={5}
            >
                {/* Resizable Wrapper */}
                {!sidebarProps.fullView && <div
                    id="dragger"
                    onMouseDown={handleMousedown}
                    onTouchStart={handleTouchStart}
                    className="nz-info-bar-dragger"
                    style={{ touchAction: "none" }}
                >
                    <div className="nz-info-bar-dragger-gutter" role="separator" aria-orientation="vertical" ></div>
                </div>}
                <div className='nz-resize-main-content'>
                    <div className={`nz-side-bar-container ${sidebarProps.fullView ? "nz-full-view" : ""}`}>
                        <div className='nz-sub-header nz-d-flex-row nz-align-center nz-justify-between nz-sidebar-title'>
                            <Label uniqueName={`${sidebarProps.uniqueName}-sidebar-title`} label={sidebarProps.headerText} />
                            <div className='nz-d-flex-row nz-align-center'>
                                {!sidebarProps.fullView && isShowFullViewBtn && !sidebarProps.isHideMaximizeButton && <ActionImage
                                    image={{
                                        uniqueName: "cancel",
                                        source: <Maximize24x24
                                            size={FnGetCssVariable('--image-size-2')}
                                            fill='none'
                                            strokeWidth={1} />,
                                        type: "svg",
                                        w: "var(--image-size-2)",
                                        h: "var(--image-size-2)",
                                        tooltip: "Maximize sidebar"
                                    }}
                                    uniqueName='cancelIcon'
                                    disabled={sidebarProps.hideSideBarCloseBtn ?? false}
                                    actionCode='cancel'
                                    w='var(--node_height)'
                                    h='var(--node_height)'
                                    handleMouse={() => {
                                        setIsShowFullViewBtn(false)
                                        setWidthOfSidebarForFqas()
                                    }}
                                />}
                                {!sidebarProps.fullView && <ActionImage
                                    image={{
                                        uniqueName: "cancel",
                                        source: <HideSidebar24x24
                                            size={FnGetCssVariable('--image-size-2')}
                                            fill='none'
                                            strokeWidth={1} />,
                                        type: "svg",
                                        w: "var(--image-size-2)",
                                        h: "var(--image-size-2)",
                                        tooltip: "Hide sidebar"
                                    }}
                                    uniqueName='cancelIcon'
                                    disabled={sidebarProps.hideSideBarCloseBtn ?? false}
                                    actionCode='cancel'
                                    w='var(--node_height)'
                                    h='var(--node_height)'
                                    handleMouse={() => {
                                        setIsShowFullViewBtn(true)
                                        handleButtonActions('close')
                                    }}
                                />}
                            </div>
                        </div>
                        <div className='nz-sidebar'>
                            {showInfoDetail && actionList && activeTab &&
                                <div
                                    className={`nz-sidebar-strip ${sidebarProps.showPopupSidebar ? "nz-popup-sidebar-strip" : ""}`}
                                    id="nz-sidebar-strip"
                                    tabIndex={-1}
                                    onMouseDown={focusSidebarStrip}
                                    onFocus={focusSidebarStrip}
                                >
                                    <MainMenu
                                        {...actionList}
                                        handleMouse={handleMouse}
                                        handleMouseEnter={handleMouseEnterSubMenu}
                                        handleMouseLeave={handleMouseLeaveSubMenu}
                                        selectedFeatureQa={selectedQa}
                                    />
                                </div>
                            }
                            {showInfoDetail && menuData && menuData.length > 0 ? <div className='nz-sidebar-expandableList'
                                ref={subMenumenuRef}
                                style={{ top: `${openPosition}px`, maxHeight: `${dynamicHeight}px`, height: 'auto' }}
                                onMouseLeave={(event: React.MouseEvent<HTMLDivElement>) => {
                                    const relatedTarget = event.relatedTarget as HTMLElement | null;
                                    if (!relatedTarget) {
                                        handleMouseMenuImage(event);
                                        return;
                                    }
                                    // Safely check if relatedTarget is still inside our menu or search input
                                    const isInside =
                                        relatedTarget?.closest(".nz-menu-search") ||
                                        relatedTarget?.closest(".nz-nav-bar") ||
                                        relatedTarget?.closest(".MuiInputBase-input") ||
                                        relatedTarget?.closest(".nz-sidebar-expandableList") ||
                                        relatedTarget?.closest(".nz-sidebar-strip");
                                    if (isInside) {
                                        return;
                                    } else {
                                        handleMouseMenuImage(event);
                                    }
                                }}
                            >
                                {showInfoDetail && menuData && menuData.length > 0 && isShowSubMenu && <MainMenu
                                    isIconVertical={false}
                                    uniqueName="NodeMenu"
                                    actionImageW='100%'
                                    actionImageH="var(--submenu_height)"
                                    w="fit-content" // Width of the entire container
                                    h="100%"
                                    bgColor="var(--bgfeaturepane2)" // Background color of the container
                                    imageW={18}
                                    imageH={18}
                                    menuSize="sm"
                                    isVertical={true}
                                    allowDND={true}
                                    featureData={menuData}
                                    isDisableSort={true}
                                    hideSearchControl={true}
                                    isShowExpandableList={true}
                                    handleSelect={handleSelectNode}
                                    hideIconExpandableList={true}
                                />}
                            </div> : <></>}
                            {showInfoDetail && activeTab && selectedNodeInfo && !sidebarProps.showPopupSidebar &&
                                <div className='nz-resize-content'>
                                    <SidebarContent
                                        selectedNodeMenu={selectedNodeMenu}
                                        Label={activeTab}
                                        uniqueName='SidebarContainer'
                                        featureId={sidebarProps.featureId}
                                        subTreeFeatureId={sidebarProps.subTreeFeatureId}
                                        selectedNode={selectedNodeInfo}
                                        treeData={sidebarProps.treeData}
                                        selectedNodeExplorer={sidebarProps.selectedNodeExplorer}
                                        isPropertyFound={isPropertyFound}
                                        handleReloadTree={handleReloadTree}
                                        apValueChange={sidebarProps.apValueChange}
                                        handleShowErrorDialog={sidebarProps.handleShowErrorDialog}
                                    />
                                </div>}
                        </div>
                    </div>
                </div>
            </Drawer>
        </div>
    )
}
export { Sidebar };
export type { ISidebar, IDevicePropertyInfo, IEMRecord, IKebabMenuResponse };