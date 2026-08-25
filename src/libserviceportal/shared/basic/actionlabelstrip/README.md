# Simple action-label-strip component that uses action-label component 

# How to use this component
- User need to pass the list of action lable props with base props. User can set its alignment based on requirement.

# Developer: NK 


# component:actionlabelstrip
# types and interfaces


export interface IActionLabelStrip {
    uniqueName: string; //Unique name for the control and required
    actionLabels: IActionLabel[];
    isVertical: boolean;//Default false and will show Horizontally
    w: number | string;//provide width based on isVertical property
    h: number | string;//provide height based on isVertical property
    bgColor?: string;
    border?: string;
    spacing?:string;
    handleMouse?: (event: any, actionCode?: string) => void;
}

export interface IActionLabel {
    uniqueName: string; //Unique name for the control and required
    label: ILabel;
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

export interface IImage {
    uniqueName:string;//uniqueName for the control and required
    source: Exclude<string, "">;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}

export interface ILabel {
    uniqueName: string; //Unique name for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}
