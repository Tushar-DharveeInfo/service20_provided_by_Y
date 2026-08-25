
import { RefObject } from "react";
import { EventDataNode, Key } from "rc-tree/lib/interface";
import Tree, { CheckInfo, DraggableConfig, DraggableFn } from "rc-tree/lib/Tree";
import { NodeDragEventParams, NodeMouseEventHandler } from "rc-tree/lib/contextTypes";
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from "./ITreeControl";

interface IBaseTree {
    treeId: string;
    className: string; // CSS class name for the tree
    allowCheckbox: boolean; // Indicates whether checkboxes are displayed
    treeData: ITreeNode[]; // Data for the tree nodes
    selectable: boolean;
    allowMultiple: boolean; // Allow multiple nodes to be selected
    allowIcon: boolean; // Display icons in tree nodes
    allowDefaultExpandAll: boolean; // Expand all nodes by default
    allowInternalDrag: boolean | DraggableFn | DraggableConfig | undefined; // Enable drag-and-drop within the tree
    expandedKeys: Key[]; // Keys of expanded nodes
    allowCheckStrictly: boolean; // Enables checkStrictly mode (parent-child check state is independent)
    strictlyCheckedKeys: {
        checked: Key[];
        halfChecked: Key[];
    } | undefined; // Keys of nodes strictly checked in `checkStrictly` mode
    checkedKeys: Key[]; // Keys of nodes checked
    selectedKeys: Key[]; // Keys of selected nodes
    treeRef: RefObject<Tree<ITreeNode>>; // Ref for the tree component
    activeKey: Key | null;
    handleNodeClick: (event: React.MouseEvent, node: ITreeNode) => void; // Event handler for click events
    handleNodeExpand: (expandedKeys: Key[], info: IExpandedNodeInfo) => void; // Event handler for expanding nodes
    onDrop: (info: NodeDragEventParams<ITreeNode> & {
        dragNode: EventDataNode<ITreeNode>;
        dragNodesKeys: Key[];
        dropPosition: number;
        dropToGap: boolean;
    }) => void; // Event handler for drag-and-drop events
    handleNodeSelect: (selectedKeys: Key[], info: ISelectedNodeInfo) => void; // Event handler for selecting nodes
    handleNodeCheck: (checked: {
        checked: Key[];
        halfChecked: Key[];
    } | Key[], info: CheckInfo<ITreeNode>) => void; // Event handler for checking nodes
    handleRightClick: (info: {
        event: React.MouseEvent;
        node: ITreeNode;
    }) => void; // Event handler for right-click on nodes
    handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void; // Event handler for key-down events
    onActiveChange: (key: Key) => void; // Event handler for active node changes
    handleDragStart: (info: NodeDragEventParams<ITreeNode>) => void;
    handleNodeDoubleClick: NodeMouseEventHandler<ITreeNode>;
    handleExternalDrop: (event: React.DragEvent<HTMLSpanElement>, targetNode: ITreeNode) => void;
    canAcceptExternalDrop: (targetNode: ITreeNode) => boolean;
    canAllowDragDrop: (sourceNode: ITreeNode) => boolean;
    handleDragEnd: (info: NodeDragEventParams<ITreeNode>) => void;
}

export type { IBaseTree }