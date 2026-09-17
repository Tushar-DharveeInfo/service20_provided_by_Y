# simple search control 

# how to use this component. 
# This component use for search control.

# Developer: TU

# Packages used for the component 

npm i @mui/material @emotion/react @emotion/styled


interface ISearchControl{    
    uniqueName:string; // unique name of control
    isShowFilterControl:boolean; // if true then display filter icon
    hiderightmousemenu:boolean // if true then hide right mouse menu
    lensDirty:boolean; // if true then change background color of lens icon
    filterDirty:boolean;// if true then change background color of filter icon
    searchInputValue:string; // search input text
    searchValueChange:(value:string)=>void;// to pass input value of parent control.
    handleFilterMouse:()=>void; // handle mouse event for filter
    handleLensMouse: (selectedCondion: "AND" | string) => void;// handle mouse event for lens
}