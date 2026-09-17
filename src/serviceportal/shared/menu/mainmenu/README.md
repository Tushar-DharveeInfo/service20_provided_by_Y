# submenu component

# How to use this component 
- User need to use this component in container and adjust the layout based on requirement

# Developer: TU

# component:MainMenu
# types and interfaces 

type menuSize = "sm" | "md" | "lg" | "xl";
interface IMainMenu {
    menuSize: MenuSize; // size of the menu
    featureData: IFeatureItem[];
    uniqueName: string; //uniqueName for the control and required
    w: number | string;//Width of strip
    h: number | string;//Height of strip 
    isVertical: boolean;//Whether label below image will show wertically or not
    isIconVertical?: Boolean; // if you pass true the it will show Label below image else label to the right of image (default is vertical)
    actionImageW?: number | string;//Width of action image
    actionImageH?: number | string;//Height of action image
    bgColor?: string;//Background color of the strip 
    tooltip?: string;//Tooltip of the strip
    border?: string;//border to show it required 
    actionImages?: IActionImageForSubMenu[]
    itemlistAlignNormal?: boolean;//default normal else flsh list to right of container
    menuActionImage?: IPropsComponent; // It renders first as a component in the strip
    optionalComponent?: IPropsComponent; // It renders last as a component in the strip
    spacing?: string;//if provided it will apply padding between container and action images
    compact?: boolean; // display subMenu in compact mode
    isShowSearchControl?: boolean;
    allowDND?: boolean; // Allow Drag and drop
    handleDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleEndDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleSelect?: (value: any, actionCode?: string, payload?: any) => void // This function will be called when an action image is selected
    handleMouse?: (event: MouseEvent | undefined, actionCode?: string, payload?: any) => void
    handleMouseLeave?: () => void
}