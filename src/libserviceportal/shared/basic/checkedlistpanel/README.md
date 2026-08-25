# Checked list panel control allows to show checked list with Authorized Icon 

## How to use this component : 
- To use this component user need to pass required props and set the layout 

## Developer: NK

## Packages used for the component 

# component:checkedlistpanel
# types and interfaces

interface IListItem {
	label: string;// label to show in the list item
	id: string;// id to handle events 
	checked?: boolean;// whether need to set checked or not
	isAuthorized?: boolean;// To show Status icon i.e. if true it will show checkCircle else crossCircle icon 
	[key: string]: any; // to allow dynamic properties
}
interface ICheckedListPanel {
	uniqueName: string;//Unique identifier
	listItems: IListItem[];// list items to show
	allowCheckbox: boolean;// whether need to allow checkbox
	allowRightIcon: boolean; //Whether need to show right Icon 
	allowMulticheck: boolean; // Whether need to allow multiple check
	allowCustomCheckLogic: boolean; // if true user need to handle check logic 
	allowHeader?: boolean; // if true it will show header
	headerText?: string;// to show content in header
	allowAdd?: boolean;// if yes it will show action panel below 
	allowEdit?: boolean;// if yes it will show action panel below 
	allowDelete?: boolean;// if yes it will show action panel below
	disableAdd?: boolean; //To disable add button 
	disableEdit?: boolean;// To disable Edit button 
	disableDelete?: boolean;// To disable Delete button 
	handleCustomCheck?: (value: string, name: string, isDefault?: boolean) => void; // Callback function to handle checkbox
	handleItemSelect?: (item: IListItem, listItems: IListItem[]) => void;//Callback function to handle Item select
	handleMouseClick?: (event: any, actionCode?: string) => void; // Callback function for handling add, edit, and delete actions
	handleUpdatedData?: (dataItems: IListItem[]) => void;// to get updated data that are checked or unchecked
}
