
import { IActionLabel } from "./IActionLabel";

interface IActionLabelStrip {
    uniqueName: string; //Unique name for the control and required
    actionLabels: IActionLabel[];
    isVertical: boolean;//Default false and will show Horizontally
    w: number | string;//provide width based on isVertical property
    h: number | string;//provide height based on isVertical property
    bgColor?: string;
    border?: string;
    spacing?: string;
    isAddMode?: boolean;
    tabIndex?: number;
    handleMouse?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void;
}

export type { IActionLabelStrip }