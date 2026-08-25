import { IElementProfile, IFormElements, ControlType, IOptionItem, IDisplayControlValuesResult, ChangedValueMap } from "@n20a/libform";
import { DisplayControlEnums, Measurement } from "../../alldefaultprops/basic/DefaultPropsFormContainer";
import { IRefData } from "../../allinterface/basic/IRefData";
import { FnGetRefList } from "../basic/FnGetRefList";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { IRefItem } from "../../context/allinterface/IMainApp";
import { DELIMITER } from "../../alldefaultprops/basic/DefaultPropsChekedListBoxControl";
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { hideGridData } from "../../alldefaultprops/tablegrid/DefaultPropsBasicGrid";
import { IControl, IControlProperties } from "../../allinterface/settingsform/ISettingsLibForm";
import { FnGetPrefixedPropertyValue } from "./FnGetPrefixedPropertyValue";
import { FnFormatDateWithAppFormat } from "../../../appcontainer/allcommon/FnFormatDateWithAppFormat";



const FnGetDisplayControlForForm = (controlName: string): ControlType => {
    const map: Record<string, ControlType> = {
        [DisplayControlEnums.TextControl]: 'text',
        [DisplayControlEnums.EditTextControl]: 'editText',
        [DisplayControlEnums.HyperlinkControl]: 'hyperlink',
        [DisplayControlEnums.ListBoxControl]: 'listBox',
        [DisplayControlEnums.TextareaControl]: 'textarea',
        [DisplayControlEnums.SpinControl]: 'spin',
        [DisplayControlEnums.FileSelectControl]: 'fileSelect',
        [DisplayControlEnums.FileUploadComboControl]: 'fileUpload',
        [DisplayControlEnums.YesNoControl]: 'yesNo',
        [DisplayControlEnums.TrueFalseControl]: 'trueFalse',
        [DisplayControlEnums.CheckedListBoxControl]: 'checkedListBox',
        [DisplayControlEnums.ComboBoxControl]: 'comboBox',
        [DisplayControlEnums.DateControl]: 'date',
        [DisplayControlEnums.TimeControl]: 'time',
        [DisplayControlEnums.EditComboControl]: 'editableCombo',
        [DisplayControlEnums.EnableDisableControl]: 'enableDisable',
        [DisplayControlEnums.EncryptedEditTextControl]: 'encryptedEditText',
        [DisplayControlEnums.HTMLEditControl]: 'htmlEdit',
        [DisplayControlEnums.HiddenEditTextControl]: 'hiddenEditText',
        [DisplayControlEnums.EmailControl]: 'email',
    };

    return map[controlName] ?? 'text';
};

const handleInputMask = async (
    inputMask: string,
    controlName: string,
    statusBarContext: IStatusBar,
    controlProps?: IControlProperties,
    refTableRecords?: IRefItem[]
): Promise<string[] | Record<string, any>[] | null> => {
    try {
        if (controlProps?.uniqueName && controlProps.uniqueName === "regex") {
            if (refTableRecords?.length) {
                const filteredRegex = refTableRecords.find((item) => item.Name?.toLowerCase() === inputMask?.toLowerCase());
                if (filteredRegex && filteredRegex.RefValue) {
                    try {
                        return [filteredRegex.RefValue];
                    } catch (err) {
                        console.error("Invalid regex pattern:", err);
                    }
                }
            }
            return null;
        }
        const normalizeValues = (data: IRefData[]): string[] | null => {
            if (!data?.length) return null;

            const values = data
                .map(d => d.Value)
                .filter(v => v && v?.toLowerCase() !== "undefined");

            return values.length ? values : null;
        };

        const getInputMaskData = async (): Promise<string[] | IRefData[] | null> => {
            // Cache
            const refData = FnGetRefList(
                inputMask,
                refTableRecords
            );
            if (refData?.length && controlName !== DisplayControlEnums.EditTextControl && controlName !== DisplayControlEnums.ListBoxControl && controlName !== DisplayControlEnums.ComboBoxControl) {
                return refData;
            }
            else if (["reftimezone"].includes(inputMask.toLowerCase())) {
                refData.map((item) => {
                    item.Label = item.Label + " (" + item.RefValue + ")"
                })
                return refData;
            }
            else {

                const cached = normalizeValues(refData);
                if (cached) return cached;
            }
            if (inputMask.trim().toLowerCase().startsWith("reflib")) {
                // API
                // return new Promise((resolve) => {
                //     axiosInterceptor(
                //         {
                //             url: MISC.GetLibRefList,
                //             data: { groupName: inputMask },
                //             disableLog: true,
                //             setFetchData: (response: any) => {
                //                 try {
                //                     if (!response?.jsonString) {
                //                         resolve(null);
                //                         return;
                //                     }

                //                     const parsed: IRefData[] = JSON.parse(response.jsonString);
                //                     if (parsed?.length && controlName !== DisplayControlEnums.EditTextControl && controlName !== DisplayControlEnums.ComboBoxControl && controlName !== DisplayControlEnums.ListBoxControl) {
                //                         resolve(parsed);
                //                     }
                //                     else {
                //                         resolve(normalizeValues(parsed));
                //                     }

                //                 } catch (err) {
                //                     console.error("RefList parse failed", err);
                //                     resolve(null);
                //                 }
                //             }
                //         },
                //         statusBarContext
                //     );
                // });
                return null
            }
            else {
                // API
                // return new Promise((resolve) => {
                //     axiosInterceptor(
                //         {
                //             url: MISC.GetRefList,
                //             data: { groupNameCollection: inputMask },
                //             disableLog: true,
                //             setFetchData: (response: any) => {
                //                 try {
                //                     if (!response?.jsonString) {
                //                         resolve(null);
                //                         return;
                //                     }

                //                     const parsed: IRefData[] = JSON.parse(response.jsonString);
                //                     if (parsed?.length && controlName !== DisplayControlEnums.EditTextControl && controlName !== DisplayControlEnums.ComboBoxControl && controlName !== DisplayControlEnums.ListBoxControl) {
                //                         resolve(parsed);
                //                     }
                //                     else {
                //                         resolve(normalizeValues(parsed));
                //                     }

                //                 } catch (err) {
                //                     console.error("RefList parse failed", err);
                //                     resolve(null);
                //                 }
                //             }
                //         },
                //         statusBarContext
                //     );
                // });
                return null
            }

        };


        // Fetch once
        let inputMaskData = await getInputMaskData();

        // ComboBox-specific filtering


        return inputMaskData;
    } catch (error) {
        console.error(
            "Error in handle inputmask:",
            error
        );

        return null;
    }
}

function convertToYYYYMMDD(dateStr: string): string {
    if (!dateStr) return "";
    try {

        const parts = dateStr.split("/");
        if (parts.length !== 3) return dateStr;

        let part1 = parseInt(parts[0], 10);
        let part2 = parseInt(parts[1], 10);
        const year = parts[2];

        let day: number;
        let month: number;

        // Detect format
        if (part1 > 12) {
            // dd/MM/yyyy
            day = part1;
            month = part2;
        } else if (part2 > 12) {
            // MM/dd/yyyy
            month = part1;
            day = part2;
        } else {
            // Default assume MM/dd/yyyy
            month = part1;
            day = part2;
        }

        const mm = String(month).padStart(2, "0");
        const dd = String(day).padStart(2, "0");

        return `${year}-${mm}-${dd}`;
    }
    catch (error) {
        console.error('Error in convert date:', error);
        return ""
    }
}

const externalControls = new Set<string>([
    DisplayControlEnums.JsonViewerControl,
    DisplayControlEnums.jsonPropertyGrid,
    DisplayControlEnums.jsonPropertyGridAdd,
    DisplayControlEnums.jsonPropertyGridRW,
]);

const FnBuildFormElementsFromControls = (
    title: string,
    controls: IControl[],
    selectedProfile: Record<string, any>,
    statusBarContext: IStatusBar,
    groupNames: string[],
    refTableRecords?: IRefItem[],
    measurementUnit?: string,
    diagnosticLevel?: string,
    isDisabled?: boolean,
    entityName?: string,
    hideTableSections?: boolean,
    optionsData?: Record<string, any>[],
    handleChangedControlValue?: (changedValue: ChangedValueMap) => boolean,
    isEditNameAllowForFeature?: boolean,
    userBasicRole?: string
): IFormElements => {
    try {

        const TableSections: Record<string, IElementProfile[]> = {};
        const isFormattedDate = (val: any) => {
            return typeof val === "string" &&
                /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}\s(AM|PM)$/i.test(val);
        };
        groupNames.forEach((groupName) => {
            const filteredControls = controls.filter(
                (control) =>
                    (control.DisplayGroupControl ?? "Default") === groupName &&
                    !externalControls.has(control.DisplayControl)
            );
            if (filteredControls.length) {
                let isDateRangeCreated = false;
                TableSections[groupName?.length ? groupName : "Default"] = filteredControls.sort((a, b) => {
                    const aOrder = a.SortOrder ?? Number.MAX_SAFE_INTEGER;
                    const bOrder = b.SortOrder ?? Number.MAX_SAFE_INTEGER;
                    return aOrder - bOrder;
                }).map((col, index): IElementProfile | null => {


                    if (!col.Name || !col.PropertyLabel) return null;
                    const fieldName = col.Name?.toLowerCase();

                    if (diagnosticLevel === "0" && hideGridData.includes(col.Name)) return null;

                    let start: number | undefined = undefined;
                    let end: number | undefined = undefined;
                    let step: number | undefined = undefined;
                    let displayUnit: string | undefined = undefined;
                    let sourceUnit: string | undefined = undefined;
                    if (col.InputMask && col.InputMask.includes('{')) {
                        const cleanString = col.InputMask.replace(/[{}]/g, "");
                        if (cleanString.length > 0) {
                            const spinObject = cleanString.split(DELIMITER.separator);
                            if (spinObject.length > 1) {
                                start = Number(spinObject[0] ?? 0);
                                end = Number(spinObject[1] ?? 100);
                                step = Number(spinObject.length > 2 ? spinObject[2] : 1);
                            }
                        }
                    }

                    let value = selectedProfile && Object.keys(selectedProfile).length ? selectedProfile[col.Name] : undefined;
                    if (groupNames.length && !value) {
                        value = FnGetPrefixedPropertyValue(selectedProfile, col.Name, groupName)
                    }
                    const isEditMode = selectedProfile && Object.keys(selectedProfile).length ? true : false;
                    let isReadOnlyControl = col.DisplayControl === DisplayControlEnums.TextControl || col.disabled || col.Name.toLowerCase() === "isnz"
                    if (col.Name.toLowerCase() === "secured" && userBasicRole?.toLowerCase() !== "admin") {
                        isReadOnlyControl = true;
                    }
                    const UpdatedDisplayControl = isEditNameAllowForFeature ? col.DisplayControl.startsWith('_') ? col.DisplayControl.slice(1) : col.DisplayControl : col.DisplayControl
                    const displayControl = FnGetDisplayControlForForm(UpdatedDisplayControl);
                    if (!displayControl) return null;
                    let controlLabel = col.PropertyLabel;
                    if (fieldName.includes("lastupdated") && value && !isFormattedDate(value)) {
                        value = FnConvertDateToUtcOrUtcToDate(value, false, true)
                    }
                    else if ((fieldName.startsWith("date") || fieldName.endsWith("date")) && value) {
                        const getDateOnly = (value: unknown): string => {
                            if (!value) return "";

                            const str = String(value);
                            const index = str.indexOf("T");

                            return index !== -1 ? str.substring(0, index) : str;
                        };
                        value = convertToYYYYMMDD(getDateOnly(value))
                    }
                    else if (fieldName.endsWith("time") && value) {
                        const FnExtractTimeFromDateTime = (
                            value?: string | null
                        ): string | null => {
                            try {
                                if (!value || typeof value !== "string") return null;

                                const parts = value.split("T");
                                if (parts.length < 2) return null;

                                const time = parts[1];
                                const cleanTime = time.split(".")[0];

                                return cleanTime || null;
                            } catch {
                                return null;
                            }
                        };

                        value = FnExtractTimeFromDateTime(value || null)
                    }
                    else if (displayControl === "date") {
                        value = FnConvertDateToUtcOrUtcToDate(value, false, true)
                    }
                    else if (col?.Name?.toLowerCase() === "entityname" && !value) {
                        value = entityName;
                    }
                    if (value === undefined || value === null || value === "") {
                        if (col.DisplayControl === DisplayControlEnums.YesNoControl
                            || col.DisplayControl === DisplayControlEnums.TrueFalseControl
                            || col.DisplayControl === DisplayControlEnums.EnableDisableControl) {

                            value = col.Value?.toString() === "0" || col.Value?.toString() === "false" ? false : true;
                        }
                        else {
                            value = col.Value?.length ? col.Value : !isEditMode ? col.DefaultAPValue : undefined
                        }
                    }
                    else {
                        if (col.DisplayControl === DisplayControlEnums.YesNoControl
                            || col.DisplayControl === DisplayControlEnums.TrueFalseControl
                            || col.DisplayControl === DisplayControlEnums.EnableDisableControl) {
                            value = value?.toString() === "0" || value?.toString() === "false" ? false : true;
                        }
                    }

                    let isRequired = false;
                    if (col.IsRequired) {
                        isRequired = true;
                    }
                    if (import.meta.env.DEV)
                        console.log('displayControl :', displayControl, value);
                    // Merge StartDate + EndDate into dateRange

                    if (
                        (col.Name === "StartDate" || col.Name === "EndDate") &&
                        col.DisplayControl === DisplayControlEnums.DateControl
                    ) {

                        if (col.Name === "EndDate" && isDateRangeCreated) {
                            return null; // skip EndDate since it is already merged
                        }

                        if (col.Name === "StartDate") {

                            const startValue = selectedProfile?.StartDate ? FnFormatDateWithAppFormat(selectedProfile?.StartDate, false) : undefined;
                            const endValue = selectedProfile?.EndDate ? FnFormatDateWithAppFormat(selectedProfile?.EndDate, false) : undefined;

                            isDateRangeCreated = true;

                            return {
                                key: `${groupName ?? "default"}_dateRange_${index}`,
                                field: "dateRange",
                                label: "Period",
                                startLabel: "Start Date",
                                endLabel: "End Date",
                                datatype: '',
                                defaultvalue: startValue && endValue ? { startDate: startValue, endDate: endValue } : undefined,
                                displaycontrol: isDisabled ? 'text' : measurementUnit?.toLowerCase() === "europe" ? 'europeanDateRange' : 'dateRange',
                                required: col.IsRequired ? true : false,
                                disabled: isDisabled,
                                displayunit: displayUnit,
                                onChangedValue: isReadOnlyControl ? undefined : handleChangedControlValue
                            };
                        }
                    }

                    return {
                        key: `${groupName ?? "default"}_${col.Name}_${index}_${Array.isArray(col.Options) ? col.Options.length : 0}_${optionsData?.length ?? 0}`,
                        field: col.Name,
                        label: controlLabel,
                        datatype: '',
                        defaultvalue: value,
                        displaycontrol: displayControl,
                        start: start,
                        end: end,
                        step: step,
                        displayunit: displayUnit,
                        sourceunit: sourceUnit,
                        required: isRequired,
                        nullAllowed: col.NullNotAllowed ? false : true,
                        disabled: isDisabled || isReadOnlyControl,
                        onChangedValue: isReadOnlyControl ? undefined : handleChangedControlValue,
                        multiple: displayControl === "fileSelect" ? false : undefined,
                        fndisplaycontrolValues: async () => {
                            if (Array.isArray(col.Options) && col.Options.length) {
                                const optionObject: IDisplayControlValuesResult = {
                                    value: value ?? "",
                                    options: col.Options.map((option): IOptionItem => ({
                                        label: String(option.label ?? option.value ?? ""),
                                        value: String(option.value ?? ""),
                                        disabled: Boolean(option.disabled),
                                    })).sort((a, b) => a.label.localeCompare(b.label)),
                                };
                                return optionObject;
                            }
                            if (optionsData?.length) {
                                const optionsArray: IOptionItem[] = [];
                                let valueToSet: IOptionItem | undefined = undefined;
                                for (let index = 0; index < optionsData.length; index++) {
                                    const item = optionsData[index];
                                    const label = col.type === "isEquipmentTypes" ? item.mty :
                                        col.type === "isAttribute" ? item.isAttribute :
                                            col.type === "isProdLine" ? item.mfgProdLine :
                                                col.type === "isProdNo" ? item.pno :
                                                    col.type === "isEntityName" ? item?.entityName :
                                                        col.type === "isPropertyGroup" ? item.pgName :
                                                            col.type === "isProperty" ? item.propertyName :
                                                                col.type === "isManufacturer" ? item.mfg :
                                                                    col.type === "team" ? item.team :
                                                                        col.type === "tag" ? item.tag :
                                                                            col.type === "tenant" ? item.tenant :
                                                                                col.type === "vendor" ? item.vendor :
                                                                                    col.type === "entityName" ? item.entityName :
                                                                                        col.type === "property" ? item.property :
                                                                                            col.type === "propertyGroup" ? item.propertyGroup
                                                                                                : item?.Manufacturer;
                                    if (!label) continue
                                    const option = {
                                        label: label,
                                        value: label,
                                        disable: false
                                    }

                                    optionsArray.push(option);

                                }
                                optionsArray.sort((a, b) => a.label.localeCompare(b.label));
                                return {
                                    value: value,
                                    options: optionsArray
                                }
                            }
                            else {
                                if (
                                    col.InputMask?.length &&
                                    !col.InputMask.includes('{')
                                ) {
                                    const optionValues = await handleInputMask(
                                        col.InputMask,
                                        col.DisplayControl,
                                        statusBarContext,
                                        undefined,
                                        refTableRecords
                                    );
                                    if (Array.isArray(optionValues) && optionValues.length && typeof optionValues[0] === "string") {
                                        const optionObject: IDisplayControlValuesResult = {
                                            value: "",
                                            options: (optionValues as string[]).sort((a, b) => a.localeCompare(b))
                                                .map((v): IOptionItem => ({
                                                    label: v,
                                                    value: v,
                                                    disabled: false
                                                }))
                                        }
                                        if (value) {
                                            optionObject.value = value
                                        }

                                        return optionObject
                                    }
                                    else if (Array.isArray(optionValues) && optionValues.length && typeof optionValues[0] === "object") {

                                        const optionObject: IDisplayControlValuesResult = {
                                            value: "",
                                            options: (optionValues as Record<string, any>[]).map((v): IOptionItem => ({
                                                label: v.Label?.length ? v.Label : v.Value,
                                                value: v.Value,
                                                disabled: false
                                            })).sort((a, b) => a.label.localeCompare(b.label))
                                        }
                                        if (value) {
                                            optionObject.value = value
                                        }

                                        return optionObject
                                    }
                                }
                            }

                            return undefined;
                        }
                    };
                }).filter((item): item is IElementProfile => item !== null);
            }
        })



        return {
            Title: title,
            HideTableSections: hideTableSections,
            TableSections,
            DisableForm: isDisabled
        };
    }
    catch (error) {
        console.error('Error in create form controls :', error);
        return {
            Title: title,
            HideTableSections: hideTableSections,
            TableSections: {}
        };
    }
};

export { FnBuildFormElementsFromControls }