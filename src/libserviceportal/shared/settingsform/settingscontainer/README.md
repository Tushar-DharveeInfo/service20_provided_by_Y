# Settings container component is the control that renders actionListControl and Settings Form togather based on the props set

## How to use this component : 
- To use this component user need to pass the required props and need to set layout

## Developer: NK

## Packages used for the component 

# component:settingscontainer
# types and interfaces

interface ISettingsContainer {
    uniqueName: string; // Unique identifier for the form container
    formControls: IControl[]; // Array of form control configurations
    allowActionList: boolean;//Whether to show the action list or not
    allowShowHeader: boolean; // indicates whether to show header of form or not 
    headerText?: string; // if provided it will show custom header text else it will show the header based on id
    actionLabelItems?: IActionLabelItem[]; // List of action labels for the action list control
    allowAdd?: boolean; // Flag to allow adding items in the action list
    allowDelete?: boolean; // Flag to allow deleting items in the action list
    showEditButton?: boolean; // Flag to show the edit button in the action list
    profileString?: string; // Serialized profile data for initializing form controls
    isAutoSave?: boolean; // Enables auto-save functionality
    featureId?: string; // Feature ID for tracking or identification purposes
    id?: string;// ID for edit profile 
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean | undefined) => void;//if isAutoSave is true then it will be used to get updated data
    handleSaveAction?: (profileData: string, id?: string | undefined) => void;// This will be called if allowActionList===false 
}

interface IControl {
    CanChange: number; // Indicates if the property can be changed (0 = No, 1 = Yes)
    IsRequired: number; // Indicates if the property is required (0 = No, 1 = Yes)
    GroupName: string; // Name of the group the property belongs to
    GroupNameDesc: string; // Description of the group
    SubGroupEntID: string; // Unique identifier for the subgroup entity
    SubGroupName: string; // Name of the subgroup
    SubGroupNameDesc: string; // Description of the subgroup
    _AP: string; // Internal identifier or key for the property
    PropertyLabel: string; // Label to display for the property
    NameDesc: string; // Description or tooltip for the property
    DefaultAPValue: string; // Default value of the property
    Value: string | null; // Current value of the property
    ValueDesc: string; // Additional description for the value
    SortOrder: number; // Order of the property in the form
    MaxInstances: number; // Maximum number of instances allowed
    InputMask: string | null; // Input mask or reference data for the property
    RegEx: string | null; // Regular expression for validation
    DisplayGroupControl: string | null; // Display group control information
    DisplayControl: string; // Control type to display (e.g., EditTextControl, DateControl)
    ChangeEvent: string; // Event triggered when the property value changes
    Secured: boolean; // Indicates if the property is secured
    IsNZ: boolean; // Indicates if the property is specific to NZ
    EntID: string; // Unique identifier for the entity
    RecID: string; // Record identifier
    LastUpdated: string; // Last updated timestamp (ISO 8601 or standard date string format)
    EntityName: string; // Name of the entity
    Name: string; // Name of the property
    disabled: boolean; // Indicates if the property is disabled
    isNewLine?: boolean;// Indicates whether control need to render in new line or not 
}

interface IActionLabelItem {
    label: string;
    tooltip: string;
    actionCode: string;
    [key: string]: any;
}