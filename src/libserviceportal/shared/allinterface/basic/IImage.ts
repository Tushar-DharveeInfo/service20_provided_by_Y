import React from "react";

interface IImage {
    uniqueName: string;//uniqueName for the control and required
    source: Exclude<string, ""> | React.ReactNode;//source can be in url/svg/encrypted form and should not empty
    w: number | string; // Width
    h?: number | string;// If Height will not be given it will set h=w 
    tooltip?: string;//Tooltip will be shown on image if provided
    type?: "svg" | "png";//Type of image, Default svg
    altSource?: string;// It will used to show the alternative image or text if source image not found 
}

export type { IImage }