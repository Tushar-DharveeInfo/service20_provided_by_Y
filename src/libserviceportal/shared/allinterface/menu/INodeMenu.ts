
import { IActionImageForSubMenu } from "../basic/IActionImageList";
import { ITreeNode } from "../entity/ITreeNode";
import { IMenuImage } from "./IMenuImage";

interface IFeatureItem {
    Label: string;// label to show in the kebab menu
    _Feature?: string | number;// feature id for unique identifier
    Tooltip?: string;// tooltip to show on kebab menu
    NodeType?: string;// Nodetype if needed in conditions
    [key: string]: string | any; // Allow additional dynamic properties
}


interface INodeMenu {
    showIcon: boolean;
    iconType?: "png" | "svg" | undefined;// icon type
    showLabel?: boolean;
    uniqueName: string;// unique name of component
    container: string; // name of container
    featureData: IFeatureItem[]// feature api data
    handleSelect: (value: IActionImageForSubMenu) => void
    label?: string;// label for kebab menu
    selectedNode?: ITreeNode; // selected node data
    iconName?: string;//show right mouse icon
    selectedRow?: Record<string, any> // selected row of grid data.
    rowIndex?: number;//row index number
    field?: string;// selected field for grid
    featureId?: string // feature id 
    MenuImage?: IMenuImage // if you want to show image instad of three dot menu
    showFilterKeywordControl?: boolean;// if you pass true then it shows filter keyword
    disbledOverlay?: boolean; // if you want to disable the menu
    allowAddCopyIconInOverlay?: boolean; // if you want to add copy icon in overlay
    handleMouse?: (item: IMenuImage) => void

}

export type { INodeMenu, IFeatureItem }