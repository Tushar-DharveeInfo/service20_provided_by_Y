# nodemenu component

# How to use this component 
- User need to use this component in container and adjust the layout based on requirement

# Developer: TU

# component:NodeMenu
# types and interfaces


import { IActionImageForSubMenu } from "../../basic/allinterface/IActionImageList";

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
    selectedNode?: any; // selected node data
    iconName?: string;//show right mouse icon
    searchedDeviceData?: any // search data for gemini info,
    selectedRow?: any // selected row of grid data.
    rowIndex?: number;//row index number
    field?: string;// selected field for grid
    featureId?: string // feature id 
}

export type { INodeMenu, IFeatureItem }