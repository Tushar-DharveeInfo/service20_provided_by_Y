
import { EventDataNode, Key } from "rc-tree/lib/interface";
import { CheckInfo, DraggableConfig, DraggableFn } from "rc-tree/lib/Tree";
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from "./ITreeControl";
import { IActionImageForSubMenu } from "../basic/IActionImageList";
import { NodeDragEventParams } from "rc-tree/lib/contextTypes";
import { IActionImage } from "../basic/IActionImage";

interface IAutoExpandResult {
    expandedKeys: Key[];
    selectedKey: Key;
    selectedNode: ITreeNode | null;
}

interface IApiElement {
    EntityName: string;
    EntID: string;
    NodeState?: string;
    Description?: string;
    Name?: string;
    type?: string;
    HasChildren?: number;
    IsNZ?: boolean;
    Secured?: boolean;
    RecordCount?: number;
    [key: string]: unknown;
}

type IHierarchicalApiData = Record<string, unknown[]>;

type IStrictCheckedKeys = {
    checked: Key[];
    halfChecked: Key[];
};

type TNodeCheckState = Key[] | IStrictCheckedKeys;

interface IFeatureTree {
    hideKebabMenu?: boolean;// if true kebab menu on node will not show
    allowCheckbox?: boolean;// Whether checkboxes are enabled for nodes
    allowIcon?: boolean;// Whether icons should be displayed for nodes
    hideCopyIcon?: boolean;// if true copy icon on node will not show
    reuseFromCache?: boolean;// whether to reuse from cache but it will used for treeContainerForFlatData
    instanceName?: string;// instancename for the tree unique to apply condition if needed
    isAllowDrag?: boolean;// to allow drag on node
    isAllowDrop?: boolean;// to allow drop on node
    allowCheckStrictly?: boolean;// Whether checkboxes follow strict hierarchy rules
    allowInternalDrag?: boolean | DraggableFn | DraggableConfig | undefined;// Whether internal drag-and-drop is enabled
    multiRootNode?: boolean;// whether tree is multiroot or not
    openAllNodes?: boolean;// Whether all nodes should be expanded by default
    allowCustomCheck?: boolean;//If true user need to handle handleCheck event 
    disableSelection?: boolean;// If true it will not allow selection  
    showLeafStatusIcon?: boolean;// to show leaf status icon
    onAddToDownloadCart?: (node: ITreeNode) => void;// to add to download cart
}

interface ITreeForHierarchicalDataContainer {
    uniqueName: string; // Unique identifier for the TreeControl component
    apiData: ITreeNode[] | IHierarchicalApiData | null | undefined;
    featureId: string;// featureId that will be handled  
    featureTreeProps: IFeatureTree;//Tree Control props 
    allowGenerateTreeData: boolean; // indicates whether need to generate treedata from API data
    defaultExpandedKeys?: Key[]; // default expanded keys to set if already tree data generated
    defaultSelectedKeys?: Key[]; // default selected keys to set if already tree data generated
    defaultCheckedKeys?: Key[]; // default checked keys to set if already tree data generated
    defaultStrictlyCheckedKeys?: {
        checked: Key[];
        halfChecked: Key[];
    }; // default strictly checked keys to set if already tree data generated
    autoFocus?: boolean;
    defaultSelectedNodeInfo?: ISelectedNodeInfo;// selected Node info if initially selection needed
    isSiteByTenant?: boolean;// This flag will change the hierarchy of 
    isFloorTree?: boolean;// indicates that whether tree is for Floor Pane or not 
    allowAPICallOnExpand?: boolean; // Whether API calls are allowed on node expansion
    allowAdd?: boolean; // Whether adding nodes is allowed
    allowEdit?: boolean; // Whether editing nodes is allowed
    allowDelete?: boolean; // Whether deleting nodes is allowed
    customIcons?: IActionImage[]; // To allow custom icons
    disableAdd?: boolean; // To disable Add
    disableEdit?: boolean; //To disable Edit
    disableDelete?: boolean; // To disable Delete
    allowMultiple?: boolean; // Whether multiple node selection is allowed
    className?: string; // Optional CSS class name for styling
    treeDataFor?: string; // This is used for Device Model whether it is "0" forLibrary or "1" for Inventory 
    allowGenerateUID?: boolean // it will create unic key of tree node
    allowUseParentIDForKey?: boolean;// if true convert function will use parentId for generate unique key
    selectedNodeExplorer?: { event: 'select'; selected: boolean; node: ITreeNode; selectedNodes: ITreeNode[]; nativeEvent: MouseEvent; }; // Explorer pane node if needed
    handleAIClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void; // Callback for AI button click
    handleNodeCheck?: (checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => void;
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => void;
    handleKebabMenuSelect?: (selectedItem: IActionImageForSubMenu) => void;//Handle kebabmeu select action if needed
    handleGeneratedTreedata?: (newTreedata: ITreeNode[], uniqueName: string) => void;// callback to generated tree data
    handleNodeExpand?: (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => void;// when API call is required for expand
    onDrop?: (info: NodeDragEventParams<ITreeNode> & {
        dragNode: EventDataNode<ITreeNode>;
        dragNodesKeys: Key[];
        dropPosition: number;
        dropToGap: boolean;
    }) => void; // it will be called when drag and drop enabled
    handleDragStart?: (info: NodeDragEventParams<ITreeNode>) => void;// to handle drag start
    handleNodeClick?: (event: React.MouseEvent, node: ITreeNode) => void;// it will be used to handle drag and drop event manually 
    handleExternalDrop?: (event: React.DragEvent<HTMLSpanElement>, targetNode: ITreeNode) => void;
    canAcceptExternalDrop?: (targetNode: ITreeNode) => boolean;
    canAllowDragDrop?: (sourceNode: ITreeNode) => boolean;
    handleDragEnd?: (info: NodeDragEventParams<ITreeNode>) => void;
}

interface ISortOptions {
    enabled: boolean;       // whether sorting should be applied
    sortBy?: keyof ITreeNode; // property to sort by, e.g., "title", "DisplayOrder"
    descending?: boolean;   // optional, default false (ascending)
}

interface IConvertedTreeResponse {
    treeData: ITreeNode[],
    expandedKeys: Key[],
    selectedKey?: Key,
    selectedNode?: ITreeNode
}

export type {
    IAutoExpandResult,
    IFeatureTree,
    ITreeForHierarchicalDataContainer,
    IApiElement,
    IHierarchicalApiData,
    IStrictCheckedKeys,
    TNodeCheckState,
    ISortOptions,
    IConvertedTreeResponse,
}