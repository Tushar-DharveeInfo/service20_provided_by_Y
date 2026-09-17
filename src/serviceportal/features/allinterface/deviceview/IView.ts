
import { ITab } from "./ITab";

 interface IView {
    svg: string; // svg base64 string
    viewTitle: string; // view title it will show below title of svg
    uniqueName: string; // uniqueName for the control
    tab: ITab; // tab object for display tabs view
    customClassName?: string; //  custon class name to for selection of svg 
}

export type {IView}