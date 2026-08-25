
interface ISearchControl {
    uniqueName: string; // unique name of control
    isShowFilterControl: boolean; // if true then display filter icon
    hideRightMouseMenu: boolean // if true then hide right mouse menu
    lensDirty: boolean; // if true then change background color of lens icon
    filterDirty: boolean;// if true then change background color of filter icon
    searchInputValue: string; // search input texthideSearchControl
    hideSearchControl?: boolean; // if true then hide search control
    isDisableSearch?: boolean;
    filterIconTooltip?: string;
    searchValueChange: (value: string) => void;// to pass input value of parent control.
    handleFilterMouse: () => void; // handle mouse event for filter
    handleLensMouse: (selectedCondion: "AND" | string) => void;// handle mouse event for lens
}
export type { ISearchControl }