# IMenuImage component

# How to use this component 
- User need to use this component in container and adjust the layout based on requirement

# Developer: TU

# component:IMenuImage
# types and interfaces


interface IMenuImage {
    uniqueName: string;//Unique identifier and required
    image: IImage;
    w: number | string; //Width
    h?: number | string;//If not provided h=w
    border?: string; // if set border will show
    actionCode?: string;// it will used to handle mouse event
    active?: boolean;//if active it image will rotate
    activeBGColor?: string;// if provided show BG color to image when rotate
    handleMouse?: (event: any, actionCode: string) => void;
    handleMouseEnter?: (event: any, actionCode: string) => void;
}
export type { IMenuImage };