
import React, { useEffect, useRef, useState } from 'react'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks';
import { Kebab24x24 } from '@n20a/libicon';
import './NodeMenu.css';
import { KebabMenuRange } from '../../../constants/Feature';
import { IActionImageForSubMenu } from '../../allinterface/basic/IActionImageList';
import { ITreeNode, ISelectedNodeInfo } from '../../allinterface/tree/ITreeControl';
import { IMenuImage, MenuImage } from '../menuimage/MenuImage';
import { useCommonVariableContext } from '../../context/hooks/CommonVariableHooks';
import { AppQA } from '../../../constants/Feature';
import { useSessionContext } from '../../context/hooks/SessionHooks';
import OverlayIconStrip from '../overlayiconstrip/OverlayIconStrip';
import { FnCopyToClipboard } from '../../allcommon/basic/FnCopyToClipboard';
import { useMainAppContext } from '../../context/hooks/MainAppHooks';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely';

interface IFeatureItem {
    Label: string; // label to show in the kebab menu
    _Feature?: string | number; // feature id for unique identifier
    Tooltip?: string; // tooltip to show on kebab menu
    NodeType?: string; // Nodetype if needed in conditions
    [key: string]: string | any; // Allow additional dynamic properties
}

interface INodeMenu {
    showIcon: boolean;
    iconType?: "png" | "svg" | undefined; // icon type
    showLabel?: boolean;
    uniqueName: string; // unique name of component
    container: string; // name of container
    featureData: IFeatureItem[]; // feature api data
    handleSelect: (value: IActionImageForSubMenu) => void;
    label?: string; // label for kebab menu
    selectedNode?: ITreeNode; // selected node data
    iconName?: string; // show right mouse icon
    selectedRow?: Record<string, any>; // selected row of grid data.
    rowIndex?: number; // row index number
    field?: string; // selected field for grid
    featureId?: string; // feature id 
    MenuImage?: IMenuImage; // if you want to show image instad of three dot menu
    showFilterKeywordControl?: boolean; // if you pass true then it shows filter keyword
    disbledOverlay?: boolean; // if you want to disable the menu
    allowAddCopyIconInOverlay?: boolean; // if you want to add copy icon in overlay
    handleMouse?: (item: IMenuImage) => void;
}

const NodeMenu = (nodeMenuProps: INodeMenu) => {
    const [menuData, setMenuData] = useState<IFeatureItem[]>();
    const [selectedItem, setSelectedItem] = useState<IFeatureItem>();
    const [selectedNodeData, setSelectedNodeData] = useState<ISelectedNodeInfo | undefined>(undefined);
    const [showKebabIcon, setShowKebabIcon] = useState<boolean>(false)
    const [isShowMenu, setIsShowMenu] = useState(false);
    const [menuImageProps, setMenuImageProps] = useState<IMenuImage>();
    const [actionMenuData, setActionMenuData] = useState<IFeatureItem[]>([])
    const [kebabMenuData, setKebabMenuData] = useState<IFeatureItem[]>([])
    const [isRecordFoundInWaterMark, setIsRecordFoundInWaterMark] = useState<boolean>(false)

    const CommonVariableContext = useCommonVariableContext()
    const statusBarContext = useStatusBarContext();
    const sessionContext = useSessionContext()
    const mainAppContext = useMainAppContext();

    useEffect(() => {
        if (nodeMenuProps.MenuImage) {
            setMenuImageProps(nodeMenuProps.MenuImage)
        } else {
            let kebebImage: IMenuImage = {
                uniqueName: "bi1",
                image: {
                    uniqueName: "Kebabimage",
                    source: <Kebab24x24
                        size={20}
                        fill='none'
                        strokeWidth={1} />,
                    type: "svg",
                    w: "var(--image-size-2)",
                    h: "var(--image-size-2)",
                    tooltip: "click to use commands"
                },
                w: 'var(--image-size-2)',
                h: 'var(--image-size-2)',
                allowAnimations: false
            }
            setMenuImageProps(kebebImage)
        }
    }, [nodeMenuProps.MenuImage, nodeMenuProps.MenuImage?.selected])
    const handleAnimationImage = (active?: boolean) => {
        if (menuImageProps && menuImageProps.allowAnimations) {
            setMenuImageProps({ ...menuImageProps, active: active });
        }
    }
    const getNodeMenuForProperty = () => {
        // const handleApiGetKebabMenu = (data: any) => {
        //     if (data.kebabJson) {
        //         const nodeData = FnParseJsonSafely(data.kebabJson)
        //         if (nodeData.KebabMenu) {
        //             const data = nodeData.KebabMenu.fitler((item: any) => (item.TotalCount !== 0))
        //             setMenuData(data)
        //             setShowKebabIcon(true)
        //         } else {
        //             setShowKebabIcon(false)
        //         }
        //     } else {
        //         setShowKebabIcon(false)
        //     }
        // }
        // const payload = {
        //     selectedNodeEntity: nodeMenuProps.selectedNode?.NodeEntityname,
        //     selectedNodeType: nodeMenuProps.selectedNode?.NodeType
        // }

        // axiosInterceptor({
        //     url: PROPERTY.GetKebabMenu,
        //     data: payload,
        //     setFetchData: handleApiGetKebabMenu
        // }, statusBarContext)
    }
    const handleClick = async (event: React.MouseEvent<HTMLDivElement> | null) => {
        if (event) {
            handleAnimationImage(true)
            setIsShowMenu(true);
        }

        if (event) {
            const submenudiv = document.getElementById('nz-sub-menu-node')
            if (submenudiv) {
                submenudiv.focus();
            }

            if (nodeMenuProps.handleMouse && nodeMenuProps.MenuImage) {

                nodeMenuProps.handleMouse(nodeMenuProps.MenuImage)
            }
        }


    }

    function handleSelectNode(value: any, _actionCode?: string | undefined, payload?: any): void {
        handleAnimationImage(false);
        setIsShowMenu(false);
        setSelectedItem(payload as IFeatureItem)
        const selectedMenu = {
            payload: payload,
            field: nodeMenuProps.field,
            container: nodeMenuProps.container,
            rowIndex: nodeMenuProps.rowIndex,
            selectedRow: nodeMenuProps.selectedRow,
        }
        if (payload.Label === "Copy" && selectedNodeData) {
            FnCopyToClipboard(selectedNodeData.node.TableLabel ? `${selectedNodeData.node.TableLabel}` : (selectedNodeData.node.Name ? selectedNodeData.node.Name : ""));
            return;
        }
        CommonVariableContext.setSelectedNodeMenu(selectedMenu)
        nodeMenuProps.handleSelect(value)

    }

    // const getRecordForWaterMarks = (selectedNodeData: ITreeNode): Promise<Record<string, unknown>[]> => {
    //     // return new Promise((resolve) => {
    //     //     axiosInterceptor(
    //     //         {
    //     //             url: NODE.GetKebabMenuData,
    //     //             data: {
    //     //                 entID: selectedNodeData.NodeEntID,
    //     //                 entityName: selectedNodeData.NodeEntityname,
    //     //                 kebabMenuTableName: "PG.Watermark",
    //     //             },
    //     //             allowShowLoader: true,
    //     //             setFetchData: async (resp: unknown, status?: string) => {
    //     //                 if (status === "200" && resp && typeof resp === "object" && 'propertyJson' in resp) {
    //     //                     try {
    //     //                         const parsed = typeof (resp as { propertyJson?: unknown }).propertyJson === "string"
    //     //                             ? FnParseJsonSafely((resp as { propertyJson: string }).propertyJson)
    //     //                             : (resp as { propertyJson?: unknown }).propertyJson;

    //     //                         const watermarkRecords =
    //     //                             parsed &&
    //     //                                 typeof parsed === "object" &&
    //     //                                 Array.isArray((parsed as Record<string, unknown>)["PG.Watermark"])
    //     //                                 ? ((parsed as Record<string, unknown>)["PG.Watermark"] as Record<string, unknown>[])
    //     //                                 : [];

    //     //                         resolve(watermarkRecords);
    //     //                     } catch (error) {
    //     //                         console.error("Error parsing watermark propertyJson:", error);
    //     //                         resolve([]);
    //     //                     }
    //     //                 } else {
    //     //                     resolve([]);
    //     //                 }
    //     //             }
    //     //         },
    //     //         statusBarContext
    //     //     );
    //     // });
    // };
    const watermarkRequestIdRef = useRef(0);
    const lastWatermarkNodeIdRef = useRef<string | null>(null);

    useEffect(() => {
        const node = selectedNodeData?.node;
        const nodeEntId = String(node?.NodeEntID ?? '');

        // Same rack node already fetched — skip duplicate API call.
        if (lastWatermarkNodeIdRef.current === nodeEntId) {
            return;
        }
        lastWatermarkNodeIdRef.current = nodeEntId;

        const requestId = ++watermarkRequestIdRef.current;
        let cancelled = false;

        const fnInit = async () => {
            // const data = await getRecordForWaterMarks(node);
            const data = []
            if (cancelled || requestId !== watermarkRequestIdRef.current) {
                return;
            }
            setIsRecordFoundInWaterMark(data.length > 0);
        };

        void fnInit();

        return () => {
            cancelled = true;
        };
    }, [
        selectedNodeData?.node?.NodeEntID,
        selectedNodeData?.node?.NodeEntityname,
        nodeMenuProps.featureId,
    ]);
    const getExplorerMenuData = async (featureId: string | null = null) => {
        if (selectedNodeData) {
            const menu: IFeatureItem[] = [];


            // let FnChildrenDisplayOrderToggleStatus = selectedNodeData && selectedNodeData?.node && selectedNodeData.node.DisplayOrder

            nodeMenuProps.featureData.forEach((item) => {
                if (item.MenuID.toString() === (featureId ? featureId : nodeMenuProps.featureId) && item._Feature && (item._Feature as number) > KebabMenuRange.MIN && item.Label !== "") {


                }
            });
            if (menu?.length > 0) {
                setShowKebabIcon(true);
            }
            else {
                setShowKebabIcon(false);
            }
            return menu;
        }
    }

    const getKebabMenuForGridRow = (selectedRow: any) => {
        const menu: IFeatureItem[] = [];
        nodeMenuProps.featureData.forEach((item) => {
            if (item.MenuID === nodeMenuProps.featureId && item._Feature && (item._Feature as number) > KebabMenuRange.MIN && item.Label !== "") {

                if (item.NodeType === "") {
                    menu.push(item)
                } else {

                    if (item.NodeType) {

                        let nodeTypeArray = item.NodeType.split(";");
                        nodeTypeArray = nodeTypeArray.map((el) => {
                            return el.trim();
                        });

                        if (selectedRow?.NodeType) {

                            nodeTypeArray.forEach((element) => {
                                if (element?.toLowerCase() === selectedRow?.NodeType?.toLowerCase()) {
                                    menu.push(item)
                                }
                            })
                        }
                    }

                }

            }
        });
        return menu;
    }
    const getKebabMenuForGridRowRef = useRef(getKebabMenuForGridRow)
    useEffect(() => {
        if (nodeMenuProps.selectedNode) {
            setSelectedNodeData({ node: nodeMenuProps.selectedNode } as ISelectedNodeInfo);
            handleClick(null)

        } else {
            setSelectedNodeData(undefined);
        }
    }, [nodeMenuProps.selectedNode])

    useEffect(() => {
        if (nodeMenuProps.selectedRow) {
            handleClick(null)
            const menuItems: IFeatureItem[] = getKebabMenuForGridRowRef.current(nodeMenuProps.selectedRow);

            setShowKebabIcon(false);
            if (menuItems?.length > 0) {
                setShowKebabIcon(true);
            } else {
                setShowKebabIcon(true);
            }
        }
        else {
            setShowKebabIcon(false);
        }
    }, [nodeMenuProps?.selectedRow?.NodeType, getKebabMenuForGridRowRef])

    // useEffect(() => {
    //     const init = async () => {
    //         if (nodeMenuProps.container === "explorer_tree") {

    //             if (nodeMenuProps.featureData) {
    //                 if (selectedNodeData && selectedNodeData.node) {
    //                     let menuData = await getExplorerMenuData();
    //                     if (menuData && menuData?.length > 0) {

    //                         setShowKebabIcon(true);
    //                     }
    //                     else {
    //                         setShowKebabIcon(false);
    //                     }
    //                     handleClick(null)

    //                 }
    //             }
    //         }
    //         else if (nodeMenuProps.container === "fqa_property_tab") {

    //             if (selectedNodeData) {
    //                 setSelectedItem(undefined)
    //                 getNodeMenuForProperty()
    //                 handleClick(null)
    //             }
    //             else {
    //                 setShowKebabIcon(false);
    //             }
    //         } else if (nodeMenuProps.container === 'helpTip') {

    //             if (nodeMenuProps.featureData.length > 0) {
    //                 setShowKebabIcon(true);
    //                 handleClick(null)
    //             }
    //         }
    //         else if (nodeMenuProps.container === "edit_report_layout") {

    //             const type = nodeMenuProps.selectedNode?.type?.toLowerCase();
    //             const isCustom = nodeMenuProps.selectedNode?.custom;
    //             if (type && (type === "layout" || type === "header" || type === "footer"
    //                 || type === "page" || type === "group" || type === "text" || type === "image"
    //                 || type === "table" || type === "chart" || type === "hspace"
    //                 || type === "vspace")) {

    //                 setShowKebabIcon(true);
    //                 handleClick(null)
    //             }
    //             else if (isCustom !== undefined) {
    //                 setShowKebabIcon(true);
    //                 handleClick(null)
    //             }
    //         }
    //         else if (nodeMenuProps.container === "edit_floor_layout") {

    //             const type = nodeMenuProps.selectedNode?.type?.toLowerCase();
    //             if (type && (type === "layout" || type === "location" || type === "device"
    //                 || type === "text" || type === "image" || type === "rect" || type === "circle" || type === "chart" || type === "hspace" || type === "vspace"
    //             )) {

    //                 setShowKebabIcon(true);
    //             }
    //             handleClick(null)
    //         }
    //         else {
    //             setShowKebabIcon(true);
    //             handleClick(null)
    //         }
    //     }
    //     init();
    // }, [selectedNodeData, isRecordFoundInWaterMark])


    useEffect(() => {

        if (menuData?.length && !nodeMenuProps.disbledOverlay) {
            let action = []
            let kebab = []
            let firstSeperatorFound: boolean = false
            for (let index = 0; index < menuData.length; index++) {
                const element = menuData[index];
                const isSeparator = element.NodeType?.toLowerCase().includes("separator");

                if (!firstSeperatorFound) {
                    action.push(element);

                    // Set only when first separator is encountered
                    if (isSeparator) {
                        firstSeperatorFound = true;
                    }
                } else {
                    kebab.push(element);
                }
            }
            let copyJson = { Label: "Copy", _Feature: "0999", NodeType: "", MenuID: "999", Tooltip: "Copy to clipboard" }
            if (action.length) {
                if (nodeMenuProps.allowAddCopyIconInOverlay) {
                    setActionMenuData([copyJson, ...action])
                } else {
                    setActionMenuData([...action])
                }
            } else {
                setActionMenuData([])
            }
            if (kebab.length) {
                setKebabMenuData(kebab)
            }
            // if (kebab.length > (6 - action.length)) {
            //     setKebabMenuData(kebab)
            // } else {
            //     setKebabMenuData([]);
            //     if (nodeMenuProps.allowAddCopyIconInOverlay) {
            //         setActionMenuData([copyJson, ...action, ...kebab])
            //     } else {
            //         setActionMenuData([...action, ...kebab])
            //     }
            // }
        }
    }, [menuData])

    return (
        <div key={nodeMenuProps.uniqueName} className='nz-node-menu'>

            {menuData && menuData?.length > 0 && !nodeMenuProps.disbledOverlay && <OverlayIconStrip
                uniqueName={nodeMenuProps.uniqueName + "overlay-icon-strip"}
                OverlayActions={actionMenuData}
                KebabMenuActions={kebabMenuData}
                OverlayActionProps={{
                    "isVertical": false,
                    "w": "100%",
                    "h": "100%",
                    "bgColor": "var(--bg-color-menu)",
                    "border": "none",
                    "menuSize": "sm",
                    "actionImageW": 24,
                    "actionImageH": 24,
                    "imageW": "18px",
                    "spacing": "0px 2px",
                    "isIconVertical": true,
                    "hideLabel": true
                }}
                handleSelect={handleSelectNode}>
                <div className="nz-node-menu-image" >
                    {/* show kebab icon */}
                    {showKebabIcon && nodeMenuProps.showIcon && menuImageProps && <MenuImage
                        {...menuImageProps}
                        handleMouse={(event: any, _actionCode: string) => {
                            if (!isShowMenu) {
                                handleClick(event);
                            }
                        }}
                        handleMouseEnter={handleClick}
                    />}
                </div>
            </OverlayIconStrip>}
            {nodeMenuProps.disbledOverlay && <div className="nz-node-menu-image" >
                {/* show kebab icon */}
                {showKebabIcon && nodeMenuProps.showIcon && menuImageProps && <MenuImage
                    {...menuImageProps}
                    handleMouse={(event: any, _actionCode: string) => {
                        if (!isShowMenu) {
                            handleClick(event);
                        }
                    }}
                    handleMouseEnter={handleClick}
                />}
            </div>}


        </div >
    )
}
export { NodeMenu };
export type { INodeMenu, IFeatureItem };