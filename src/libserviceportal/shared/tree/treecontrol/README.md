# Base tree control with required event handling

# How to use this component : 
- To use this component user need to pass required props and set layout

# Developer: NK

# Packages used for the component 
npm i rc-tree


interface ITreeNode {
    key: string;
    NodeEntityname: string | null;
    NodeEntID: string | null;
    stepNo: number;
    parentEntID: string | null;
    NodeState: string | null;
    Description: string | null;
    title: any;
    children: ITreeNode[];
    treetype: any;
    Name: string | null;
    Type: string | null;
    icon: any;
    HasChildren: number | null;
    IsNZ?: boolean;
    checkable?: boolean;
    Secured?: boolean;
    ParentEQID?: string | number;
    GroupName?: string;
    IsAuthorized?: boolean;
    IsPatchPort?: boolean;
    className?: string;
    PortStatus?: string | null;
    NodeType?: string;
    ViewShortName?: string;
    SlotsNeeded?: number;
    EntityPgClass?: string;
    TableLabel?: string;
    HasRelated?: boolean;
    SubGroupEntID?: string | number;
    DeviceID?: string | number;
    EQID?: string | number;
    ShapeID?: string | number;
    disabled?: boolean;
    checkStrictly?: boolean;
    MountedDeviceEntID?: string;
    MountedDeviceViewEntID?: string;
    MountedDeviceName?: string;
    MountedDeviceDescription?: string;
    MountedDeviceHasPowerPort?: number;
    MountedDeviceHasNetworkPort?: number;
    MountedDeviceIntelDCMState?: string;
    MountedDeviceEntityName?: string;
    MountedDeviceNodeType?: string;
    isLeaf?: boolean;
    MaxInstances?: number;
    DisplayControl?: any;
    ParentName?: string;
    HasPowerPorts?: number;
    HasNetworkPorts?: number;
    PGClassName?: string;
    NaturalSortorder?: number;
    DisplayOrder?: number;
    MountPosition?: number;
    IntelDCMState?: string;
    [key: string]: any; // to allow dynamic properties
}

interface ISelectedNodeInfo {
    event: "select";
    selected: boolean;
    node: ITreeNode;
    selectedNodes: ITreeNode[];
    nativeEvent?: MouseEvent;
}
interface IExpandedNodeInfo {
    node: ITreeNode;
    expanded: boolean;
    nativeEvent: MouseEvent;
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
    defaultSelectedNodeInfo?: ISelectedNodeInfo;// selected Node info if initially selection needed
    className?: string; // Optional CSS class for styling
    allowAPICallOnExpand?: boolean;//indicates whether need to call API on expand
    allowCheckbox?: boolean; // Enable checkboxes for nodes
    allowMultiple?: boolean; // Allow multiple node selection
    allowIcon?: boolean; // Show icons next to nodes
    allowDefaultExpandAll?: boolean; // Expand all nodes by default
    allowInternalDrag?: boolean; // Enable drag-and-drop within the tree
    allowCheckStrictly?: boolean; // Strict checking for parent-child nodes
    allowAdd?: boolean;// To show Add button 
    allowEdit?: boolean;// To show Edit button 
    allowDelete?: boolean;// To show Delete button 
    disableAdd?: boolean;// To disable Add button 
    disableEdit?: boolean;// To disable Edit button 
    disableDelete?: boolean;// To disable Delete button 
    disableSelection?: boolean;// Disable selection of node
    handleAIClick?: (event: any, actionCode?: string) => void; // Callback function for handling add, edit, and delete actions
    handleNodeExpand?: (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => void;//handle node expand event
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[]) => void;// handle node select event
    handleNodeCheck?: (checked: {
        checked: Key[];
        halfChecked: Key[];
    } | Key[], info: CheckInfo<ITreeNode>) => void;//handle node check event
    onDrop?: (info: NodeDragEventParams<ITreeNode>) => void; // it will be called when drag and drop enabled
    handleNodeClick?: (event: React.MouseEvent, node: ITreeNode) => void;// it will be used to handle drag and drop event manually 
}

interface IBaseTree {
    className: string; // CSS class name for the tree
    allowCheckbox: boolean; // Indicates whether checkboxes are displayed
    treeData: ITreeNode[]; // Data for the tree nodes
    allowMultiple: boolean; // Allow multiple nodes to be selected
    allowIcon: boolean; // Display icons in tree nodes
    allowDefaultExpandAll: boolean; // Expand all nodes by default
    allowInternalDrag: boolean; // Enable drag-and-drop within the tree
    expandedKeys: Key[]; // Keys of expanded nodes
    allowCheckStrictly: boolean; // Enables checkStrictly mode (parent-child check state is independent)
    strictlyCheckedKeys: {
        checked: Key[];
        halfChecked: Key[];
    } | undefined; // Keys of nodes strictly checked in `checkStrictly` mode
    checkedKeys: Key[]; // Keys of nodes checked
    selectedKeys: Key[]; // Keys of selected nodes
    treeRef: RefObject<any>; // Ref for the tree component
    handleNodeClick: (event: React.MouseEvent, node: ITreeNode) => void; // Event handler for click events
    handleNodeExpand: (expandedKeys: Key[], info: IExpandedNodeInfo) => void; // Event handler for expanding nodes
    onDrop: (info: NodeDragEventParams<ITreeNode>) => void; // Event handler for drag-and-drop events
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
}