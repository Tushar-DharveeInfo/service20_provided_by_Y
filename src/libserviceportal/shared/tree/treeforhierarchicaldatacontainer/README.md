# tree container to handle Hierarchical data

# How to use this component : 
- To use this component user need to pass required props and set layout

# Developer: NK

# Packages used for the component 

# component:treeforhierarchicaldatacontainer
# types and interfaces

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
    [key: string]: any; // Allows additional dynamic properties
}
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
    allowInternalDrag?: boolean;// Whether internal drag-and-drop is enabled
    multiRootNode?: boolean;// whether tree is multiroot or not
    openAllNodes?: boolean;// Whether all nodes should be expanded by default
    allowCustomCheck?: boolean;//If true user need to handle handleCheck event 
    disableSelection?: boolean;// If true it will not allow selection  
}

interface ITreeForHierarchicalDataContainer {
    uniqueName: string; // Unique identifier for the TreeControl component
    apiData: any; // API data that are flat and can be converted to hierarchy
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
    defaultSelectedNodeInfo?: ISelectedNodeInfo;// selected Node info if initially selection needed
    isFloorTree?: boolean;// indicates that whether tree is for Floor Pane or not 
    allowAPICallOnExpand?: boolean; // Whether API calls are allowed on node expansion
    allowAdd?: boolean; // Whether adding nodes is allowed
    allowEdit?: boolean; // Whether editing nodes is allowed
    allowDelete?: boolean; // Whether deleting nodes is allowed
    disableAdd?: boolean; // To disable Add
    disableEdit?: boolean; //To disable Edit
    disableDelete?: boolean; // To disable Delete
    allowMultiple?: boolean; // Whether multiple node selection is allowed
    className?: string; // Optional CSS class name for styling
    treeDataFor?: string; // This is used for Device Model whether it is "0" forLibrary or "1" for 
    selectedNodeExplorer?: { event: 'select'; selected: boolean; node: ITreeNode; selectedNodes: ITreeNode[]; nativeEvent: MouseEvent; }; // Explorer pane node if needed
    handleAIClick?: (event: any, actionCode?: string) => void; // Callback for AI button click
    handleNodeCheck?: (checked: Key[] | { checked: Key[]; halfChecked: Key[]; }, info: CheckInfo<ITreeNode>) => void;
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => void;
    handleKebabMenuSelect?: (selectedItem: any) => void;//Handle kebabmeu select action if needed
    handleGeneratedTreedata?: (newTreedata: ITreeNode[], uniqueName: string) => void;// callback to generated tree data
}
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
    treetype: string;
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
    DisplayControl?: string | any;
    ParentName?: string;
    HasPowerPorts?: number;
    HasNetworkPorts?: number;
    PGClassName?: string;
    NaturalSortorder?: number;
    DisplayOrder?: number;
    MountPosition?: number;
    IntelDCMState?: string;
    [key: string]: string | any; // to allow dynamic properties
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
    handleAIClick?: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string, payload?: string | object | unknown) => void; // Callback function for handling add, edit, and delete actions
    handleNodeExpand?: (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => void;//handle node expand event
    handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[]) => void;// handle node select event
    handleNodeCheck?: (checked: {
        checked: Key[];
        halfChecked: Key[];
    } | Key[], info: CheckInfo<ITreeNode>) => void;//handle node check event
    onDrop?: (info: NodeDragEventParams<ITreeNode>) => void; // it will be called when drag and drop enabled
    handleNodeClick?: (event: React.MouseEvent, node: ITreeNode) => void;// it will be used to handle drag and drop event manually 
}