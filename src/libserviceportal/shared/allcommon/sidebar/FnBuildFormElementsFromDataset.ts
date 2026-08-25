import { IElementProfile, IFormElements, ControlType, IOptionItem, IDisplayControlValuesResult, ChangedValueMap } from "@n20a/libform";
import { DisplayControlEnums, Measurement } from "../../alldefaultprops/basic/DefaultPropsFormContainer";
import { IDataset, ITableFormMeta } from "../../allinterface/sidebar/IPropertyFormContainer";
import { IRefData } from "../../allinterface/basic/IRefData";
import { FnGetRefList } from "../basic/FnGetRefList";
import { IStatusBar } from "../../context/allinterface/IStatusBar";
import { IRefItem } from "../../context/allinterface/IMainApp";
import { DELIMITER } from "../../alldefaultprops/basic/DefaultPropsChekedListBoxControl";
import { FnConvertDateToUtcOrUtcToDate } from "../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { hideGridData } from "../../alldefaultprops/tablegrid/DefaultPropsBasicGrid";
import { IControlProperties } from "../../allinterface/settingsform/ISettingsLibForm";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

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
                return null;
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


const FnBuildFormElementsFromDataset = (
    title: string,
    tableMetaMap: Record<string, ITableFormMeta>,
    dataset: IDataset,
    statusBarContext: IStatusBar,

    refTableRecords?: IRefItem[],
    measurementUnit?: string,
    diagnosticLevel?: string,
    isDisabled?: boolean,
    pgTableName?: string, //if passed pg table will show first
    entityName?: string,
    selectedNode?: ITreeNode,
    parentNodes?: ITreeNode[],
    handleControlValueChange?: (changedValue: ChangedValueMap) => boolean,
    isEditNameAllowForFeature?: boolean,
    userBasicRole?: string
): IFormElements => {
    try {
        const TableSections: Record<string, IElementProfile[]> = {};
        const tableNames = Object.keys(dataset);
        const orderedTableNames = pgTableName && tableNames.includes(pgTableName)
            ? [
                pgTableName,
                ...tableNames.filter(name => name !== pgTableName)
            ]
            : tableNames;
        const isFormattedDate = (val: any) => {
            return typeof val === "string" &&
                /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}\s(AM|PM)$/i.test(val);
        };
        orderedTableNames.forEach((tableName: string) => {
            const tableData = dataset[tableName];
            if (!Array.isArray(tableData)) return;

            const tableMeta = tableMetaMap[tableName];
            if (!tableMeta?.columns?.length) return;

            const { columns, label } = tableMeta;
            const row = tableData[0];

            //  USE TABLE LABEL AS SECTION KEY
            TableSections[label || tableName] = [...columns]
                .sort((a, b) => {
                    const aOrder = a.SortOrder ?? Number.MAX_SAFE_INTEGER;
                    const bOrder = b.SortOrder ?? Number.MAX_SAFE_INTEGER;
                    return aOrder - bOrder;
                })
                .map((col, index): IElementProfile | null => {


                    if (!col.PName || !col.PropertyLabel) return null;

                    if (diagnosticLevel === "0" && hideGridData.includes(col.PName)) return null;

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
                                start = spinObject[0] ?? 0;
                                end = spinObject[1] ?? 100;
                                step = spinObject.length > 2 ? spinObject[2] : 1;
                            }
                        }
                    }

                    let isReadOnlyControl = col.DisplayControl === DisplayControlEnums.TextControl || col.Disabled || col.PName.toLowerCase() === "isnz"
                    if (col.PName.toLowerCase() === "secured" && userBasicRole?.toLowerCase() !== "admin") {
                        isReadOnlyControl = true;
                    }
                    const UpdatedDisplayControl = isEditNameAllowForFeature ? col.DisplayControl.startsWith('_') ? col.DisplayControl.slice(1) : col.DisplayControl : col.DisplayControl
                    const displayControl = FnGetDisplayControlForForm(UpdatedDisplayControl);
                    if (!displayControl) return null;
                    let value = row && Object.keys(row).length ? row[col.PName] : undefined;
                    const fieldName = col.PName?.toLowerCase();
                    let controlLabel = col.PropertyLabel;
                    if (fieldName.includes("lastupdated") && value && !isFormattedDate(value)) {
                        value = FnConvertDateToUtcOrUtcToDate(value, false, true)
                    }
                    else if (fieldName !== "dateformat" && (fieldName.startsWith("date") || fieldName.endsWith("date")) && value) {

                        value = FnConvertDateToUtcOrUtcToDate(value, false, false)// getDateOnly(value)
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

                    else if (col?.PName?.toLowerCase() === "entityname" && !value) {
                        value = entityName;
                    }
                    else if (col.PName == "ParentEntityName" && col.DisplayControl === "TextControl" && selectedNode) {

                        value = selectedNode?.EntityName ?? selectedNode?.NodeEntityname;
                    } else if (col.DisplayControl === "TextControl" && parentNodes?.length) {
                        let foundNode = parentNodes.filter((node) => {
                            return node?.NodeType && col.PName.includes(node?.NodeType)
                        })
                        if (foundNode?.length) {
                            value = foundNode[0].Name || "";
                        }
                    }
                    let isRequired = false;
                    if (col.RequiredToAddRecord && col.RequiredToUpdateRecord) {
                        isRequired = true;
                    }

                    return {
                        key: `${tableName}_${col.PName}_${col.InputMask}_${index}`,
                        field: col.PName,
                        label: controlLabel,
                        datatype: '',
                        defaultvalue: value,
                        displaycontrol: displayControl,
                        displayunit: displayUnit,
                        sourceunit: sourceUnit,
                        start: start,
                        end: end,
                        step: step,
                        required: isRequired,
                        nullAllowed: col.NullNotAllowed ? false : true,
                        disabled: isReadOnlyControl || isDisabled,
                        onChangedValue: isReadOnlyControl ? undefined : handleControlValueChange,
                        fndisplaycontrolValues: col.InputMask ? async () => {
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
                                        options: (optionValues as string[])
                                            .sort((a, b) => a.localeCompare(b)).map((v): IOptionItem => ({
                                                label: v,
                                                value: v,
                                                disabled: false
                                            }))
                                    }
                                    if (row) {
                                        optionObject.value = row[col.PName]
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

                            return undefined;
                        } : undefined
                    };
                })
                .filter((item): item is IElementProfile => item !== null);
        });

        return {
            Title: title,
            HideTableSections: false,
            TableSections,
            DisableForm: isDisabled
        };
    }
    catch (error) {
        console.error('Error in create form controls :', error);
        return {
            Title: title,
            HideTableSections: false,
            TableSections: {}
        };
    }
};

export { FnBuildFormElementsFromDataset }