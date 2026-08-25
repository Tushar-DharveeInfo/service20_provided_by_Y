# Simple Sub Menu component that uses for right mouse menu list Component 

# How to use this component
- use for right mouse menu list display with hr.

# Developer: TU 

# Packages used for the component 


# component:submenu
# types and interfaces

interface IActionImageForSubMenu extends IActionImage {
    separator?: boolean; // Whether to show separator or not (it will added Hr in between action images)
    menuData?: any;
}
interface IMainMenu {
    uniqueName: string; //uniqueName for the control and required
    actionImages: IActionImageForSubMenu[];
    w: number | string;//Width of strip
    h: number | string;//Height of strip 
    bgColor?: string;//Background color of the strip 
    tooltip?: string;//Tooltip of the strip
    border?: string;//border to show it required
    spacing?: string;//if provided it will apply padding between contianer and action images 
    handleSelect?: (value: any) => void // This function will be called when an action image is selected
}

interface IActionImage {
    uniqueName: string;//Unique identifier and required
    image: IImage;
    w: number | string; //Width
    actionCode: string;//it will be used to identify the action source
    handleMouse: (event: any, actionCode?: string, payload?: any) => void;
    h?: number | string;//if not provided it will take h=w
    label?: ILabel;
    labelAlign?: "bottom" | "top";//if not provided it will take bottom
    labeltooltip?: string;
    border?: "none" | string; //If set border will show default none
    selected?: boolean;// it will be used to set selected 
    disabled?: boolean;// it will be used to set the action image disabled
    payload?: any // api data to be sent
}

interface IImage {
    uniqueName:string;//uniqueName for the control and required
    source: Exclude<string, "">;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}

 interface ILabel {
    uniqueName: string; //uniqueName for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}