import { JSX } from "react";

/* Entity/node shape used by sidebar, menus, and selection context (not an rc-tree widget). */
interface ITreeNode {
    key: string;
    NodeEntityname: string | null;
    NodeEntID: string | null;
    stepNo: number;
    parentEntID: string | null;
    NodeState: string | null;
    Description: string | null;
    title: JSX.Element | string;
    children: ITreeNode[];
    treetype: string;
    Name: string | null;
    Type: string | null;
    icon: JSX.Element | null;
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
    EntityPgClass?: string;
    TableLabel?: string;
    HasRelated?: boolean;
    SubGroupEntID?: string | number;
    DeviceID?: string | number;
    EQID?: string | number;
    ShapeID?: string | number;
    disabled?: boolean;
    isLeaf?: boolean;
    ParentName?: string;
    PGClassName?: string;
    NaturalSortorder?: number;
    DisplayOrder?: number;
    MountPosition?: number;
    IntelDCMState?: string;
    DetailsJson?: string | any;
    EQType?: string | any;
    TenantIDList?: string | null;
    VendorIDList?: string | null;
    TagIDList?: string | null;
    TeamIDList?: string | null;
    ContainedByDeviceID?: string;
    [key: string]: string | any;
}

interface ISelectedNodeInfo {
    event: "select" | "auto-select" | "auto-select-expand" | "found-select";
    selected: boolean;
    node: ITreeNode;
    selectedNodes: ITreeNode[];
    nativeEvent?: MouseEvent;
}

export type { ISelectedNodeInfo, ITreeNode };
