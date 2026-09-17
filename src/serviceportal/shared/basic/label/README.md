# Simple Label component

# How to use this component 
- User need to use this component in container and adjust the layout based on requirement

# Developer: NK 

# component:label
# types and interfaces 

// This interface will be used in the Label component

// This interface will be used in the Label component
interface ILabel {
    uniqueName: string; //uniqueName for the control and required
    label: Exclude<string, "">;//string length can be 1 to (2,147,483,647)
    tooltip?: string;
    fontSize?: string;// font size can be given "14px", "1em" ,"80%".
    fontStyle?: "normal" | "italic";// if not provided it will take default from css
    fontWeight?: "normal" | string;// if not provided it will take default from css
    color?: string;
}


