interface IControlProperties {
    uniqueName: string;
    isEditMode?: boolean;
    [key: string]: any;
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
    IsSaved?: boolean;
    OldValue?: string | null; // Current value of the property
    IsReadOnly?: boolean;
    type?: string;
    NullNotAllowed?: boolean;
    [key: string]: string | any; // to allow dynamic properties
}
interface ISettingsLibForm {
    uniqueName: string; // unique identifier for the control
    controls: IControl[]; // list of controls to render in thr form
    profileString: string; // if in edit mode need to pass profilestring 
    allowShowHeader: boolean; // indicates whether to show header of form or not 
    isDisableForm: boolean;// whether to disable or not 
    headerText?: string; // if provided it will show custom header text else it will show the header based on id
    id?: string; // id of the form if needed
    featureId?: string; // featre id if needed
    subFeatureId?: string; // featre id if needed
    isAutoSave?: boolean; // indicates whether value need to save automatically when user change
    refDataObject?: any; // will be used for custom implementation 
    allowTestIcon?: boolean;
    testApiJson?: Record<string, any>;
    allowHelp?: boolean;
    minDate?: Date;
    measurementUnit?: string;
    container?: string;
    allowShowSectionHeader?: boolean;
    isFormValueChangedExternal?: boolean;
    isAddressFormRequired?: boolean;
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean) => Promise<boolean> | void | Promise<void>;
    handleValueChangeExternal?: (values: Record<string, unknown>) => Promise<boolean> | void | Promise<void>;
    handleSaveForm?: (profileData: string, id?: string) => void;
    handleActionImageClick?: (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string,
        payload?: string | unknown
    ) => void;
    handleShowMessage?: (message: string, isShowOkOnly?: boolean) => Promise<boolean> | void;
}
interface IEnabledApiResult {
    success: boolean;
    data?: Record<string, any>;
    error?: Record<string, any>;
}
interface IIsAuthorizedResponse {
    isAuthorized?: boolean;
    IsAuthorized?: boolean;
}
export type { ISettingsLibForm, IEnabledApiResult, IControl, IControlProperties, IIsAuthorizedResponse }