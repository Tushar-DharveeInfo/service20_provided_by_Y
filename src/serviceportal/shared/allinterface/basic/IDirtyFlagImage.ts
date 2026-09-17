
import React from "react";
import { IImage } from "./IImage";

interface IDirtyFlagImage {
    uniqueName: string;// unique name of component
    image: IImage; // Image
    w: number | string; //Width
    h?: number | string;// If Height will not be given it will set h=w 
    allowBorder?: boolean; //If true it will allow border
    isDirty?: boolean; // If true it will add background
    bgColor?: string; // Background color of the container
    disabled?: boolean;
    handleMouse?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export type { IDirtyFlagImage }