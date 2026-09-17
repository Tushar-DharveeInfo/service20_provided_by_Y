# Simple Image (svg, png) component with option to add tooltip

# How to use this component : 
-To use the component user need to call this component in container div and can set the layout 

# Developer: NK 

# Packages used for the component 


# component:image
# types and interfaces

export interface Iimage {
    uniqueName:string;//uniqueName for the control and required
    source: Exclude<string, "">;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}


