# Simple view container to disply device.

## How to use this component : 
-To use the component user need to use device preview.

## Developer: TU

## Packages used for the component 
> 
> npm i react-zoom-pan-pinch


# component:ViewContainer
# types and interfaces

interface IViewContainer {
    uniqueName: string;//uniqueName for the control and required
    entID: string;//entID for the control
    views: IView[] // views array to show svg and title
    title?: string// title of the control;
    selectedTabName?: string;//selected Tab name;
    responsive?:boolean;// if passed true then device view will be responsive
    disableZoom?: boolean,//disable zoom in and zoom out
    deviceProps?: any // Basic props of device 
    capacityProps?: any;//PowerThermal props of device 
    statusProps?: any;//Status props of device 
    handleMouse?: (event:React.MouseEvent,actionCode?:string)=>void;//selected action code 
    handleMouseDoubleClick?: (event:React.MouseEvent,actionCode?:string)=>void;//selected action code 
    ThreeDView?:boolean;
    selectedNode?:ITreeNode
    selectedDeviceViewId?:string//  entid selected device
}


 interface IView {
    svg: string; // svg base64 string
    viewTitle: string; // view title it will show below title of svg
    customClassName?: string; //  custon class name to for selection of svg 
    uniqueName: string; // uniqueName for the control
    tab: ITab; // tab object for display tabs view
}
interface ITab {
	label: string; // tabs label 
	tooltip: string; // tooltip of label
}