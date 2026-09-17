# simple dirty flag component with background effect with image.

# how to use this component. 
# This component use for filter icon and search lens icon in keyword search.

# Developer: TU

# Packages used for the component 



# component:dirtyflagimage
# types and interfaces

export interface IdirtyFlagImage {
    uniqueName: string;// unique name of component
    image: Iimage; // Image
    w: number | string; //Width
    h?: number | string;// If Height will not be given it will set h=w 
    allowBorder?: boolean; //If true it will allow border
    isDirty?: boolean; // If true it will add background
    bgColor?: string; // Background color of the container
    handleMouse?: (event: any) => void;
}

export interface Iimage {
    uniqueName:string;//uniqueName for the control and required
    source: Exclude<string, "">;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}

