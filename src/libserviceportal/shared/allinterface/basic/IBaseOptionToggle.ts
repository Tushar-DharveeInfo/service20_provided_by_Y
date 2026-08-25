
import { IActionImage } from "./IActionImage"

interface IBaseOptionToggle {
    showIcon: boolean;
    uniqueName: string;// unique name of component
    imageObject: IActionImage; //image object with source, width and height
    container: string;
    handleSelect: (value: string) => void;
}

export type { IBaseOptionToggle }