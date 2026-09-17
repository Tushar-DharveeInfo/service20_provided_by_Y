# Simple YesNoFormContainer component

# How to use this component 
- User need to use this component in container and adjust the layout based on requirement

# Developer: TU

# Packages used for the component 
npm i @mui/material
npm i @emotion/react
npm i @emotion/styled

# component:confirmyesno
# types and interfaces 

export interface IconfirmYesNo {
    isOpen:boolean;// open message Dialog
    uniqueName: string; //uniqueName for the control and required
    message:string; // dialog
    showOkButton?:boolean // if you want to display only ok button then pass true.
    handleYesButtonClick:()=>void //yes button click
    handleNoButtonClick:()=>void //no button click
    handleOkButtonClick?:()=>void //ok button click
}

export interface Ilabel {
    uniqueName: string; //uniqueName for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}