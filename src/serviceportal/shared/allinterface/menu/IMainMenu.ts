
import { IActionImageForSubMenu } from "../basic/IActionImageList";
import { IActionImage } from "../basic/IActionImage";


interface IPropsComponent {
    /*
        * The React component to be rendered.
        * It should be passed as a parameter.
        */
    component: React.ElementType;
    /*
        * Props to be passed to the component.
        * This is a record of key-value pairs where the keys are strings and values can be of any type.
        */
    props: Record<string, any>;
}
interface IMenuItem {
    Label: string;// label to show in the kebab menu
    _Feature?: string | number;// feature id for unique identifier
    Tooltip?: string;// tooltip to show on kebab menu
    NodeType?: string;// Nodetype if needed in conditions
    PopupQa?: boolean;
    subMenu?: IMenuItem[];
    [key: string]: string | any; // Allow additional dynamic properties
}

type MenuSize = "sm" | "md" | "lg" | "xl";
interface IMainMenu {
    menuSize: MenuSize; // size of the menu
    featureData: IMenuItem[];
    uniqueName: string; //uniqueName for the control and required
    w: number | string;//Width of strip
    h: number | string;//Height of strip 
    isVertical: boolean;//Whether label below image will show wertically or not
    isIconVertical?: Boolean; // if you pass true the it will show Label below image else label to the right of image (default is vertical)
    actionImageW?: number | string;//Width of action image
    actionImageH?: number | string;//Height of action image
    imageW?: number | string;//Width of image
    imageH?: number | string;//Height of image
    bgColor?: string;//Background color of the strip 
    tooltip?: string;//Tooltip of the strip
    border?: string;//border to show it required 
    actionImages?: IActionImageForSubMenu[]
    itemlistAlignNormal?: boolean;//default normal else flsh list to right of container
    menuActionImage?: IPropsComponent; // It renders first as a component in the strip
    optionalComponent?: IPropsComponent; // It renders last as a component in the strip
    spacing?: string;//if provided it will apply padding between container and action images
    compact?: boolean; // display subMenu in compact mode
    hideSearchControl?: boolean;
    allowDND?: boolean; // Allow Drag and drop
    selectedFeature?: IMenuItem; //for set selected data
    selectedFeatureQa?: string;
    isShowExpandableList?: boolean;// To show expandable list
    hideLabel?: boolean; // if you pass true then shows label below image
    hideIconExpandableList?: boolean;
    isMenuWithAbsolute?: boolean;
    isAppQA?: boolean;
    isDisableSort?: boolean;
    handleDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleStartDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleEndDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleSelect?: (value: any, actionCode?: string, payload?: any) => void // This function will be called when an action image is selected
    handleMouse?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string, payload?: any) => void
    handleMouseEnter?: (event: MouseEvent | undefined, actionCode?: string, payload?: any) => void
    handleMouseLeave?: () => void
}

interface IActionImageForList extends IActionImage {
    separator?: boolean; // Whether to show separator or not (it will added Hr in between action images)
}


export type { IMainMenu, IPropsComponent, IMenuItem, IActionImageForList }
