
import { IActionImage } from "./IActionImage";

interface IActionImageForSubMenu extends IActionImage {
    separator?: boolean; // Whether to show separator or not (it will added Hr in between action images)
    menuData?: any;
    PopupQa?: boolean;
    draggable?: boolean;
}
interface IActionImageList {
    uniqueName: string; //uniqueName for the control and required
    w: number | string;//Width of strip
    h: number | string;//Height of strip 
    actionImages?: IActionImageForSubMenu[];
    bgColor?: string;//Background color of the strip 
    tooltip?: string;//Tooltip of the strip
    border?: string;//border to show it required
    spacing?: string;//if provided it will apply padding between contianer and action images 
    allowDND?: boolean; // Allow Drag and drop
    handleDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleEndDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleSelect?: (value: any, actionCode?: string, payload?: any) => void // This function will be called when an action image is selected
    handleStartDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleMoseLeave?: () => void //mouse move out of strip
}

export type { IActionImageForSubMenu, IActionImageList }
