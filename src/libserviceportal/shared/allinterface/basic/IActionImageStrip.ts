
import { IActionImage } from "./IActionImage";
import { IMenuItem, IPropsComponent } from "../menu/IMainMenu";

interface IActionImageStrip {
    uniqueName: string;//Unique name for the control and required
    isVertical: boolean;//Whether strip will show wertically or not
    w: number | string;//Width of strip
    h: number | string;//Height of strip 
    itemlistAlignNormal?: boolean;//default normal else flsh list to right of container
    menuActionImage?: IPropsComponent; // It renders first as a component in the strip
    actionImages?: IActionImage[]; // it render actionimage in the strip
    optionalComponent?: IPropsComponent;// It renders last as a component in the strip
    bgColor?: string;//Background color of the strip 
    border?: string;//border to show it required
    spacing?: string;//if provided it will apply padding between contianer and action images 
    allowDND?: boolean; // Allow Drag and drop
    selectedFeature?: IMenuItem;//selected feature to set
    selectedFeatureQa?: string;
    isAppQA?: boolean;
    hideLabel?: boolean; // Hide labels
    handleDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleEndDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleStartDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleMouse?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string, payload?: any) => void;
    handleMouseEnter?: (event: MouseEvent | undefined, actionCode?: string, payload?: any) => void;
    handleMouseLeave?: (event?: React.MouseEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void;
}

export type { IActionImageStrip }