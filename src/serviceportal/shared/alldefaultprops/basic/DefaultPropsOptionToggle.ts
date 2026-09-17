
import { IOptionItem } from "../../allinterface/basic/IOptionsFilter";

const searchControlChecks: IOptionItem[] = [
    {
        uniqueName: "AND",//unique identifier name for the control
        isRenderAsForm: true, //Indicates whether render as form or not 
        label: "AND", //Label to show for the toggle 
        value: 1, // Indicates the toggle is ON (can be "0" for OFF)
        isDefault: false, // Whether value set by default or not
        tooltip: "AND", //Tooltip to show on the control
        disabled: false, // Disable the toggle control

    },
    {
        uniqueName: "OR",//unique identifier name for the control
        isRenderAsForm: true, //Indicates whether render as form or not 
        label: "OR", //Label to show for the toggle 
        value: 0, // Indicates the toggle is ON (can be "0" for OFF)
        isDefault: false, // Whether value set by default or not
        tooltip: "OR", //Tooltip to show on the control
        disabled: false, // Disable the toggle control

    },
]

export { searchControlChecks }