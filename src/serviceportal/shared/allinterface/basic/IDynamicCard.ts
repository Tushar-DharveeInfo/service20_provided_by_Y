import { KeyboardEvent, MouseEvent } from "react";
import { IImage } from "./IImage";
import { IActionImageForSubMenu } from "./IActionImageList";
import { IMenuItem } from "../menu/IMainMenu";


interface IDynamicCard {
    uniqueName: string;
    Content: React.ReactNode;
    data: unknown;
    featureId?: string;
    ContentImage?: IImage;
    isSelected?: boolean;
    onClick?: (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>, data: unknown) => void;
    className?: string;
    containerName?: string;
    featureData?: IMenuItem[];
    hideRightMouseMenu?: boolean
    allowEditButton?: boolean;
    allowDeleteButton?: boolean;
    isEditDisabled?: boolean;
    isDeleteDisabled?: boolean;
    tabIndex?: number;
    role?: string;
    ariaSelected?: boolean;
    onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
    handleNodeMenuOnClick?: (menu: IActionImageForSubMenu, selectedRow: any, containerName: string) => void
    handleMouseForEdit?: (data: unknown) => void
    handleMouseForDelete?: (data: unknown) => void
}

export type { IDynamicCard }
