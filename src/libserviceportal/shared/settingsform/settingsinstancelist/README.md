# Settings Instance List with Add, Edit and Delete button

## How to use this component : 
- To use this component user need to pass the required props and set the layout 

## Developer: NK

## Packages used for the component 


# component:settingsinstancelist
# types and interfaces

interface ISettingsInstanceList {
    uniqueName: string; // A unique name for identifying the action list
    actionLabelItems: IActionLabelItem[]; // Array of action labels for the action list
    handleSelectListItem: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string) => void; // Function to handle list item selection
    handleActionButtonClick: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string) => void; // Function to handle Add, Edit, and Delete button clicks
    selectedItem?: IActionLabelItem;//This will be used to set the item selected
    allowAdd?: boolean; // Optional flag to enable the Add button
    showEditButton?: boolean; // Optional flag to enable the Edit button
    allowDelete?: boolean; // Optional flag to enable the Delete button
    disableAdd?: boolean;//to disable action image 
    disableEdit?: boolean;//to disable action image 
    disableDelete?: boolean;//to disable action image 
}

interface IBaseSettingsInstanceList {
    uniqueName: string; // A unique name used for generating unique keys and identifiers
    actionLabels: IActionLabel[]; // Array of action labels with associated actions
    allowAdd: boolean; // Optional flag to show the Add button
    showEditButton: boolean; // Optional flag to show the Edit button
    allowDelete: boolean; // Optional flag to show the Delete button
    disableAdd: boolean;//to disable action image 
    disableEdit: boolean;//to disable action image 
    disableDelete: boolean;//to disable action image 
    handleSelectListItem: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string) => void; // Callback function for handling label strip actions
    handleMouseClick: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string) => void; // Callback function for handling add, edit, and delete actions
}

interface IActionLabel {
    uniqueName: string; //Unique name for the control and required
    label: ILabel;
    w: number | string; //Width
    actionCode: string;
    handleMouse: (event: any, actionCode?: string) => void;
    h?: number | string;//if not provided it will take h=w
    align?: "center" | "left" | "right";//Label alignment. Default "center"
    border?: string;
    selected?: boolean;//if true it will be highlighted as selected
    allowIcon?: boolean;// if true it will show checkCircle or cancel from the property
    isSuccess?: boolean;// if true it will show checkCircle else cancel icon 
    imageTooltip?: string;// if provided it will show the tooltip 
}


interface IActionLabelItem {
    label: string;
    tooltip: string;
    actionCode: string;
    [key: string]: any;
}