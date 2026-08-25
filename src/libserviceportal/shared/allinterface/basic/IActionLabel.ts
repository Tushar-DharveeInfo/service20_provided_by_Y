
import { ILabel } from './ILabel'

interface IActionLabel {
    uniqueName: string; //Unique name for the control and required
    label: ILabel;
    w: number | string; //Width
    actionCode: string;
    handleMouse: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string) => void;
    h?: number | string;//if not provided it will take h=w
    align?: "center" | "left" | "right";//Label alignment. Default "center"
    border?: string;
    selected?: boolean;//if true it will be highlighted as selected
    allowIcon?: boolean;// if true it will show checkCircle or cancel from the property
    isSuccess?: boolean;// if true it will show checkCircle else cancel icon 
    imageTooltip?: string;// if provided it will show the tooltip
    showIconLast?: boolean;//to show icon last
    iconSource?: string;//if provided it will show the icon
    tabIndex?: number
}

export type { IActionLabel }
