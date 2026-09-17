
import { IImage } from "../basic/IImage";
import { ILabel } from "../basic/ILabel";

interface IMenuImage {
    uniqueName: string;//Unique identifier and required
    image: IImage;
    label?: ILabel;
    w: number | string; //Width
    h?: number | string;//If not provided h=w
    border?: string; // if set border will show
    actionCode?: string;// it will used to handle mouse event
    active?: boolean;//if active it image will rotate
    BGColor?: string;// if provide show BG color to image
    allowAnimations?: boolean; //if true it will show animation like rotate
    activeBGColor?: string;// if provided show BG color to image when rotate
    hoverBGColor?: string;//if provided the show bg color on hover on image 
    allowHoverEffect?: boolean; // if you pass true  the it shows hover effect with background white 
    selected?: boolean;
    showLabel?: boolean;
    handleMouse?: (event: any, actionCode: string) => void;
    handleMouseEnter?: (event: any, actionCode: string) => void;
    handleMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void
    tabIndex?: number;
}
export type { IMenuImage };