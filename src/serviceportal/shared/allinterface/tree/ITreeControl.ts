
import { EventDataNode, Key } from "rc-tree/lib/interface";
import { CheckInfo, DraggableConfig, DraggableFn } from "rc-tree/lib/Tree";
import { NodeDragEventParams, NodeMouseEventHandler } from "rc-tree/lib/contextTypes";
import { JSX } from "react";
import { IActionImage } from "../basic/IActionImage";
interface ITreeNode {
    key: string;
    NodeEntityname: string | null;
    NodeEntID: string | null;
    stepNo: number;
    parentEntID: string | null;
    Description: string | null;
    title: JSX.Element | string;
    children: ITreeNode[];
    treetype: string;
    Name: string | null;
    Type: string | null;
    icon: JSX.Element | null;
    HasChildren: number | null;
    checkable?: boolean;
    EQID?: string | number;
    ParentEQID?: string | number;
    NodeType?: string;
    ViewShortName?: string;
    ParentName?: string;
    DisplayOrder?: number;
    DetailsJson?: string | any;
    EQType?: string | any;
    Height?: string;
    Width?: string;
    Length?: string;
    DeviceEntId?: string;
    DeviceViewEntId?: string;
    isLeaf?: boolean;
    ParentNodeType?: string;
    [key: string]: any;
}

interface ISelectedNodeInfo {
    event: "select" | "auto-select" | "auto-select-expand" | "found-select";
    selected: boolean;
    node: ITreeNode;
    selectedNodes: ITreeNode[];
    nativeEvent?: MouseEvent;
}

interface IExpandedNodeInfo {
    node: ITreeNode;
    expanded: boolean;
    nativeEvent?: MouseEvent;
}

interface ITreeControl {
    uniqueName: string;//unique identifier for the control
    treeData: ITreeNode[]; // Array of nodes for the tree structure
    defaultExpandedKeys: Key[];// array of keys to set default expanded node 
    defaultSelectedKeys: Key[];// array of keys to set default selected node 
    defaultCheckedKeys: Key[];// array of keys to set default checked node 
    defaultStrictlyCheckedKeys?: {
        checked: Key[];
        halfChecked: Key[];
    };// if passed and allowCheckStrictly is true then it will apply to show Checked and HalfChecked
    autoFocus?: boolean;
    featureId?: string;
    defaultSelectedNodeInfo?: ISelectedNodeInfo;// selected Node info if initially selection needed
    className?: string; // Optional CSS class for styling
    allowAPICallOnExpand?: boolean;//indicates whether need to call API on expand
    allowCheckbox?: boolean; // Enable checkboxes for nodes
    allowMultiple?: boolean; // Allow multiple node selection
    allowIcon?: boolean; // Show icons next to nodes
    allowDefaultExpandAll?: boolean; // Expand all nodes by default
    allowInternalDrag?: boolean | DraggableFn | DraggableConfig | undefined; // Enable drag-and-drop within the tree
    allowCheckStrictly?: boolean; // Strict checking for parent-child nodes
    allowAdd?: boolean;// To show Add button 
    allowEdit?: boolean;// To show Edit button 
    allowDelete?: boolean;// To show Delete button
    customIcons?: IActionImage[]; // To allow custom icons 
    disableAdd?: boolean;// To disable Add button 
    disableEdit?: boolean;// To disable Edit button 
    disableDelete?: boolean;// To disable Delete button 
    disableSelection?: boolean;// Disable selection of node
    handleAIClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: string | object | unknown) => void; // Callback function for handling add, edit, and delete actions
    handleNodeExpand?: (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => void;//handle node expand event
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[], isCalledFromExpand?: boolean) => void;// handle node select event
    handleNodeCheck?: (checked: {
        checked: Key[];
        halfChecked: Key[];
    } | Key[], info: CheckInfo<ITreeNode>) => void;//handle node check event
    onDrop?: (info: NodeDragEventParams<ITreeNode> & {
        dragNode: EventDataNode<ITreeNode>;
        dragNodesKeys: Key[];
        dropPosition: number;
        dropToGap: boolean;
    }) => void; // it will be called when drag and drop enabled
    handleNodeClick?: (event: React.MouseEvent, node: ITreeNode) => void;// it will be used to handle drag and drop event manually 
    handleDragStart?: (info: NodeDragEventParams<ITreeNode>) => void;
    handleNodeDoubleClick?: NodeMouseEventHandler<ITreeNode>;
    handleExternalDrop?: (event: React.DragEvent<HTMLSpanElement>, targetNode: ITreeNode) => void;
    canAcceptExternalDrop?: (targetNode: ITreeNode) => boolean;
    canAllowDragDrop?: (sourceNode: ITreeNode) => boolean;
    handleDragEnd?: (info: NodeDragEventParams<ITreeNode>) => void;
}

export type { ITreeControl, IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode }