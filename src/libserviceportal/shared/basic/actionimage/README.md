# Simple Image (svg, png) component with option to use mouse event and label

# How to use this component : 
-To use the component user need to call this component in container div and can set the layout 

# Developer: NK 

# Packages used for the component 


# component:actionimage
# types and interfaces

export interface IactionImage {
    uniqueName: string;//Unique identifier and required
    image: Iimage;
    w: number | string; //Width
    actionCode: string;//it will be used to identify the action source
    handleMouse: (event: React.MouseEvent, actionCode?: string, payload?: any) => void;
    h?: number | string;//if not provided it will take h=w
    label?: Ilabel;
    labelAlign?: "bottom" | "top";//if not provided it will take bottom
    labeltooltip?: string;
    border?: "none" | string; //If set border will show default none
    selected?: boolean;// it will be used to set selected 
    disabled?: boolean;// it will be used to set the action image disabled
    payload?: any // api data to be sent
}

export interface Iimage {
    uniqueName: string;//uniqueName for the control and required
    source: Exclude<string, "">;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}

// This interface will be used in the Label component
export interface Ilabel {
    uniqueName: string; //uniqueName for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}