

interface IJsonViewerControl {
    uniqueName: string; // A unique identifier for the component
    label: string; // The label text to display
    isRenderAsForm: boolean; // Whether render from form or not if not it hide label and desc
    value: string; // value json string 
    isRequired: boolean;
    containerName: string;
    showAsDiv?: boolean;
    tabIndex?: number;// set tabindex
    nameDesc?: string; // to show tooltip on the label
    valueDesc?: string;// to guide user about the value
    tooltip?: string; // Tooltip text displayed on hover
    inputMask?: string;         // it will call function and get data to compare whether input matches the criteria
    handleValueChange?: (value: string, name: string, isDefault?: boolean) => void; // Function to handle value changes
}

export type { IJsonViewerControl }