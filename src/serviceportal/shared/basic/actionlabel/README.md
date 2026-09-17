# Simple action label component

# How to use this component 
- To use it user need to place it in container and handle mouse event if required

# Developer: NK 

# component:actionlabel
# types and interfaces

export interface IactionLabel {
    uniqueName: string; //Unique name for the control and required
    label: Ilabel;
    w: number | string; //Width
    actionCode: string;
    handleMouse: (event: any, actionCode?: string) => void;
    h?: number | string;//if not provided it will take h=w
    align?: "center" | "left" | "right";//Label alignment. Default "center"
    border?: string;
    selected?: boolean;//if true it will be highlighted as selected
    allowIcon?:boolean;// if true it will show checkCircle or cancel from the property
    isSuccess?:boolean;// if true it will show checkCircle else cancel icon 
    imageTooltip?:string;// if provided it will show the tooltip 
}

export interface Iimage {
    uniqueName:string;//uniqueName for the control and required
    source: Exclude<string, "">;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}

export interface Ilabel {
    uniqueName: string; //uniqueName for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}