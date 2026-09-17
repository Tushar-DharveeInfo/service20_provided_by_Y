
import { IImage } from "./IImage";
import { ILabel } from "./ILabel";

interface IActionImage {
    uniqueName: string;//Unique identifier and required
    image: IImage;
    w: number | string; //Width
    actionCode: string;//it will be used to identify the action source
    handleMouse: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: Record<string, any>) => void;
    h?: number | string;//if not provided it will take h=w
    label?: ILabel;
    labelAlign?: "bottom" | "top";//if not provided it will take bottom
    labeltooltip?: string;
    tooltip?: string; // display tooltip
    border?: "none" | string; //If set border will show default none
    selected?: boolean;// it will be used to set selected 
    disabled?: boolean;// it will be used to set the action image disabled
    payload?: Record<string, any> // api data to be sent
    PopupQa?: boolean;
    allowEventPropagation?: boolean;
    handleMouseEnter?: (event: any, actionCode?: string, payload?: Record<string, any>) => void;
    handleMouseLeave?: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string, payload?: Record<string, any>) => void;
}

export type { IActionImage }