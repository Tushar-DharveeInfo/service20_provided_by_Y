
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AddressForm, ChangedValueMap, FormElementsRenderer, IAddress, IFormData, IFormElements } from '@n20a/libform'
import { Help24x24, Save24x24, TestAPI24x24 } from '@n20a/libicon'

import '@n20a/libform/style.css'
import './SettingsLibForm.css'

import { useMainAppContext } from '../../context/hooks/MainAppHooks'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks'
import { getDiagnosticLevelData } from '../../context/contextandprovider/CommonVariable'
import { FnGetCssVariable } from '../../allcommon/FnGetCssVariable'
import { FnHideShowSaveIconForForm } from '../../allcommon/basic/FnHideShowSaveIconForForm'
import { FnGetExtensionFromFileName } from '../../allcommon/basic/FnGetExtensionFromFileName'
import { FnGetNameFromFileName } from '../../allcommon/basic/FnGetNameFromFileName'
import { FnBuildFormElementsFromControls } from '../../allcommon/settingsform/FnBuildFormElementsFromControls'
import { FnCallApiForIntegration } from '../../allcommon/settingsform/FnCallApiForIntegration'
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely'
import { DisplayControlEnums } from '../../alldefaultprops/basic/DefaultPropsFormContainer'
import { IImage } from '../../allinterface/basic/IImage'

import { ActionImage } from '../../basic/actionimage/ActionImage'
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
    isNewLine?: boolean; // Indicates whether control need to render in new line or not 
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
    isDisableForm: boolean; // whether to disable or not 
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
import { JsonViewerControl } from '../../basic/jsonviewercontrol/JsonViewerControl'
import { Label } from '../../basic/label/Label'
import { OneToManyPropertyFormWithGrid } from '../onetomanypropertyformwithgrid/OneToManyPropertyFormWithGrid'
import { useSessionContext } from '../../context/hooks/SessionHooks'
import { FnCheckPermissionToEditName, IFeaturePermission } from '../../allcommon/FnCheckPermissionToEditName'

// Normalizes libform changed values to string values expected by save handlers.
function normalizeChangedControlValue(rawValue: unknown): unknown {
    if (typeof rawValue === "boolean") {
        return rawValue ? "1" : "0";
    }
    if (typeof rawValue === "number") {
        return rawValue ? rawValue.toString() : "0";
    }
    return rawValue;
}

// Parses profile JSON array wrapper used by settings forms.
function parseProfileString(profileString?: string): Record<string, unknown> | undefined {
    try {
        if (!profileString) return undefined;
        const parsed: unknown = FnParseJsonSafely(profileString);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] && typeof parsed[0] === "object") {
            return parsed[0] as Record<string, unknown>;
        }
        return undefined;
    } catch (error) {
        console.error("Failed to parse settings form profile string", error);
        return undefined;
    }
}

// Resolves external JSON/grid control value from profile or control default.
function getExternalControlValue(
    control: IControl,
    selectedProfile?: Record<string, unknown>
): unknown {
    if (selectedProfile && Object.keys(selectedProfile).length > 0 && selectedProfile[control.Name] !== undefined) {
        return selectedProfile[control.Name];
    }
    if (control.DefaultAPValue) {
        return control.DefaultAPValue;
    }
    return undefined;
}

// Reads a file as base64 content for profile save payloads.
function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Unexpected file reader result"));
                return;
            }
            const fileContentBlob = result.split(",").length > 1 ? result.split(",")[1] : result;
            resolve(fileContentBlob ?? "");
        };
        reader.readAsDataURL(file);
    });
}
const SESSION_EDIT_PERMISSION_VARS = ["AppQAName", "AppQAMenuName", "AppQAFeatureName", "FeatureName"] as const;
type ISessionEditPermissionVar = (typeof SESSION_EDIT_PERMISSION_VARS)[number];

// Parses the session edit permission key built from SESSION_EDIT_PERMISSION_VARS.
const parseSessionEditPermissionKey = (key: string): Record<ISessionEditPermissionVar, string> => {
    const values: Record<ISessionEditPermissionVar, string> = {
        AppQAName: "",
        AppQAMenuName: "",
        AppQAFeatureName: "",
        FeatureName: "",
    };
    key.split("|").forEach((part) => {
        const colonIndex = part.indexOf(":");
        if (colonIndex === -1) return;
        const variableName = part.slice(0, colonIndex);
        if (SESSION_EDIT_PERMISSION_VARS.includes(variableName as ISessionEditPermissionVar)) {
            values[variableName as ISessionEditPermissionVar] = part.slice(colonIndex + 1);
        }
    });
    return values;
};
const SettingsLibForm = ({ id, container, refDataObject, uniqueName, allowShowSectionHeader, isDisableForm, allowHelp, testApiJson, featureId, isAutoSave, allowTestIcon, allowShowHeader, controls, isAddressFormRequired, profileString, headerText, isFormValueChangedExternal, handleSaveForm, handleActionImageClick, handleShowMessage, handleValueChange, handleValueChangeExternal }: ISettingsLibForm) => {
    const [formElements, setFormElements] = useState<IFormElements>();
    const [selectedProfile, setSelectedProfile] = useState<Record<string, unknown>>();
    const [groupNames, setGroupNames] = useState<string[]>();
    const [updatedValuesExternal, setUpdatedValuesExternal] = useState<Record<string, unknown>>({});
    const [updatedAddress, setUpdatedAddress] = useState<IAddress>({
        Address1: "",
        Address2: "",
        City: "",
        State: "",
        Country: "",
        Zip: ""
    });
    const [controlsToRenderExternal, setControlsToRenderExternal] = useState<IControl[]>();
    const [jsonForView, setJsonForView] = useState<Record<string, unknown>>();
    const [loading, setLoading] = useState(true);
    const [showOverlay, setShowOverlay] = useState(false);
    const updatedValuesRef = useRef<Record<string, unknown>>(undefined);
    const overlayTimerRef = useRef<number | null>(null);
    const prevDeps = useRef<Record<string, unknown>>(undefined);
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const sessionContext = useSessionContext();
    const prevId = useRef<string>(undefined);

    // Auto-saves control changes and shows a brief saved overlay when successful.
    const handleChangedControlValue = useCallback((changedValue: ChangedValueMap) => {
        if (!changedValue || !Object.keys(changedValue).length) return true;

        const key = Object.keys(changedValue)[0];
        const value = normalizeChangedControlValue(Object.values(changedValue)[0]);

        void (async () => {
            try {
                if (key?.toLowerCase() === "enabled" && container) {
                    return;
                }

                const isSaved = await handleValueChange?.(value, key);
                if (!isSaved) return;

                setShowOverlay(true);

                if (overlayTimerRef.current) {
                    clearTimeout(overlayTimerRef.current);
                }

                overlayTimerRef.current = window.setTimeout(() => {
                    setShowOverlay(false);
                    overlayTimerRef.current = null;
                }, 2000);
            } catch (error) {
                console.error("Failed to auto-save settings form value", error);
            }
        })();

        return true;
    }, [handleValueChange]);

    // Session values used for edit-name permission; keyed so useMemo reacts to value changes.
    const sessionEditPermissionKey = SESSION_EDIT_PERMISSION_VARS
        .map((variableName) => {
            const item = sessionContext.SessionList.find((row) => row.VariableName === variableName);
            return `${variableName}:${item?.SessionValue ?? ""}`;
        })
        .join("|");
    // Check session and whether edit is allowed for name fields starting with _.
    const isEditAllowedForFeature = useMemo(() => {
        const permissionValues = parseSessionEditPermissionKey(sessionEditPermissionKey);
        const hasPermissionData = SESSION_EDIT_PERMISSION_VARS.some(
            (variableName) => permissionValues[variableName].length > 0
        );
        if (!hasPermissionData) return false;

        const session: IFeaturePermission = {
            AppQAName: permissionValues.AppQAName,
            AppQAMenuName: permissionValues.AppQAMenuName,
            AppQAFeatureName: permissionValues.AppQAFeatureName,
        };
        const featureName = permissionValues.FeatureName;
        if (!session.AppQAName && featureName) {
            return FnCheckPermissionToEditName(featureName, true);
        }
        return FnCheckPermissionToEditName(session);
    }, [sessionEditPermissionKey]);

    // Clears saved overlay timer on unmount.
    useEffect(() => {
        return () => {
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
            }
        };
    }, []);

    const userBasicRole = useMemo(() => {
        return sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "loginuserbasicrolename")?.SessionValue
    }, [sessionContext.SessionList])

    // Rebuilds form elements when controls, profile, or reference data change.
    useEffect(() => {
        const currentDeps = {
            id,
            controls,
            profileString,
            isDisableForm,
            isAutoSave,
            headerText,
            allowShowHeader,
            refTableRecordsLength: mainAppContext.refTableRecords?.length,
            refDataObjectLength: refDataObject?.length,
            handleChangedControlValue
        };

        const depsChanged =
            !prevDeps.current ||
            JSON.stringify(prevDeps.current) !== JSON.stringify(currentDeps);

        if (!depsChanged) return;

        updatedValuesRef.current = undefined;
        prevDeps.current = currentDeps;

        if (!controls) return;

        try {
            const addressFieldNames = new Set([
                "address1",
                "address2",
                "city",
                "state",
                "country",
                "zip",
                "countrycode",
                "gps",
                "timezoneoffset"
            ]);

            const addressControls = controls.filter(control =>
                addressFieldNames.has(control.Name?.toLowerCase() ?? "")
            );

            // Remove address controls from normal controls
            const controlsForForm = controls.filter(control =>
                !addressFieldNames.has(control.Name?.toLowerCase() ?? "")
            );

            const parsedProfile =
                id || isAutoSave
                    ? parseProfileString(profileString)
                    : undefined;

            /*
             * Find value from parsed profile.
             *
             * Supports:
             * Address1
             * ContactDetails_Address1
             * AnyPrefix_Address1
             */
            const getProfileValue = (fieldName: string): string => {
                if (!parsedProfile) return "";

                // Exact key first
                if (parsedProfile[fieldName] != null) {
                    return String(parsedProfile[fieldName]);
                }

                // Find dynamic prefixed key
                const matchedKey = Object.keys(parsedProfile).find(
                    key =>
                        key.toLowerCase().endsWith(
                            `_${fieldName.toLowerCase()}`
                        )
                );

                return matchedKey
                    ? String(parsedProfile[matchedKey] ?? "")
                    : "";
            };

            /*
             * Get DefaultValue from address control.
             */
            const getDefaultValue = (fieldName: string): string => {
                const control = addressControls.find(
                    item =>
                        item.Name?.toLowerCase() ===
                        fieldName.toLowerCase()
                );

                return String(control?.DefaultValue ?? "");
            };

            let addressValue: IAddress;

            if (id || isAutoSave) {
                // EDIT / AUTO SAVE MODE

                const gps = getProfileValue("GPS");

                const [latitude = "", longitude = ""] = gps
                    .split(",")
                    .map(value => value.trim());

                addressValue = {
                    Address1: getProfileValue("Address1"),
                    Address2: getProfileValue("Address2"),
                    City: getProfileValue("City"),
                    State: getProfileValue("State"),
                    Country: getProfileValue("Country"),
                    Zip: getProfileValue("Zip"),
                    CountryCode: getProfileValue("CountryCode"),
                    Latitude: latitude,
                    Longitude: longitude,
                    TimezoneOffset: getProfileValue("TimezoneOffset")
                };
            } else {
                // ADD MODE - use control DefaultValue

                const gps = getDefaultValue("GPS");

                const [latitude = "", longitude = ""] = gps
                    .split(",")
                    .map(value => value.trim());

                addressValue = {
                    Address1: getDefaultValue("Address1"),
                    Address2: getDefaultValue("Address2"),
                    City: getDefaultValue("City"),
                    State: getDefaultValue("State"),
                    Country: getDefaultValue("Country"),
                    Zip: getDefaultValue("Zip"),
                    CountryCode: getDefaultValue("CountryCode"),
                    Latitude: latitude,
                    Longitude: longitude,
                    TimezoneOffset: getDefaultValue("TimezoneOffset")
                };
            }

            setUpdatedAddress(addressValue);

            // Keep selectedProfile unchanged
            setSelectedProfile(parsedProfile);

            const derivedGroupNames = [
                ...new Set(
                    controls.map(
                        x => x.DisplayGroupControl ?? "Default"
                    )
                )
            ];

            const isEnableFound = controls.find(
                item =>
                    item.DisplayControl ===
                    DisplayControlEnums.EnableDisableControl &&
                    item.Name?.toLowerCase() === "enabled"
            );

            if (
                isEnableFound &&
                container &&
                id &&
                parsedProfile &&
                parsedProfile["Enabled"] &&
                parsedProfile["EnvPrefix"]
            ) {
                FnCallApiForIntegration(
                    container.toLowerCase(),
                    String(parsedProfile["EnvPrefix"]),
                    handleShowMessage
                )
                    .then(result => setJsonForView(result))
                    .catch(error =>
                        console.error(
                            "Failed to load integration API preview",
                            error
                        )
                    );
            }

            // Get existing external controls
            const controlExternal = controlsForForm.filter(
                control =>
                    control.DisplayControl ===
                    DisplayControlEnums.JsonViewerControl ||
                    control.DisplayControl ===
                    DisplayControlEnums.jsonPropertyGrid ||
                    control.DisplayControl ===
                    DisplayControlEnums.jsonPropertyGridAdd ||
                    control.DisplayControl ===
                    DisplayControlEnums.jsonPropertyGridRW
            );

            // Add AddressForm
            if (addressControls.length > 0) {
                const firstAddressControl = addressControls[0];

                controlExternal.push({
                    ...firstAddressControl,
                    Name: "Address",
                    DisplayControl: DisplayControlEnums.AddressForm
                });
            }

            if (controlExternal.length) {
                setControlsToRenderExternal(controlExternal);
            } else {
                setUpdatedValuesExternal({});
                setControlsToRenderExternal(undefined);
            }

            setGroupNames(derivedGroupNames);

            const form = FnBuildFormElementsFromControls(
                !allowShowHeader && !isAutoSave
                    ? headerText
                        ? headerText
                        : parsedProfile
                            ? "Edit Form"
                            : "Add Form"
                    : "",
                controlsForForm,
                parsedProfile ?? {},
                statusBarContext,
                derivedGroupNames,
                mainAppContext.refTableRecords,
                "usa",
                getDiagnosticLevelData(),
                isDisableForm,
                undefined,
                allowShowSectionHeader ? false : true,
                refDataObject ?? undefined,
                isAutoSave || isEnableFound
                    ? handleChangedControlValue
                    : undefined,
                isEditAllowedForFeature,
                userBasicRole ?? undefined
            );

            setFormElements(form);
        } catch (error) {
            console.error(
                "Failed to build settings form elements",
                error
            );
        } finally {
            setLoading(false);
        }
    }, [
        id,
        controls,
        profileString,
        isDisableForm,
        isAutoSave,
        allowShowSectionHeader,
        headerText,
        allowShowHeader,
        mainAppContext.refTableRecords?.length,
        refDataObject?.length,
        handleChangedControlValue,
        isEditAllowedForFeature
    ]);
    // Refreshes JSON viewer data when enabled integration settings change.
    useEffect(() => {
        if (selectedProfile?.Enabled === "1" && container && selectedProfile?.EnvPrefix) {
            FnCallApiForIntegration(
                container,
                String(selectedProfile.EnvPrefix),
                handleShowMessage
            )
                .then((result) => setJsonForView(result))
                .catch((error) => console.error("Failed to refresh integration API preview", error));
        }
    }, [container, selectedProfile]);

    // Resets or applies test API JSON when form id or test payload changes.
    useEffect(() => {
        if (prevId.current !== id) {
            setJsonForView(undefined);
            FnHideShowSaveIconForForm('hide');
            prevId.current = id;
            return;
        }

        setJsonForView(testApiJson);
    }, [testApiJson, id]);

    // Serializes form section values and delegates save to parent handler.
    const handleSavePropertyForm = async (formData: IFormData) => {
        try {
            if (Object.values(formData.TableSections).length > 1 && handleSaveForm) {
                handleSaveForm(JSON.stringify(formData), id);
                return;
            }

            const section = Object.values(formData.TableSections)[0];
            if (!section) return;

            const processedSection: Record<string, unknown> = { ...section };
            for (const key of Object.keys(section)) {
                const sectionValue = section[key];

                if (key === "dateRange" && sectionValue && typeof sectionValue === "object") {
                    const range = sectionValue as Record<string, unknown>;

                    if (range.startDate) {
                        processedSection["StartDate"] = range.startDate;
                    }

                    if (range.endDate) {
                        processedSection["EndDate"] = range.endDate;
                    }

                    delete processedSection["dateRange"];
                    continue;
                }

                const fileValue = Array.isArray(sectionValue) && sectionValue.length > 0 && sectionValue[0] instanceof File
                    ? sectionValue[0]
                    : sectionValue;

                if (fileValue instanceof File) {
                    const extension = FnGetExtensionFromFileName(fileValue.name);
                    const file_name = FnGetNameFromFileName(fileValue.name);
                    const base64 = await readFileAsBase64(fileValue);

                    processedSection["FPFileContent"] = base64;
                    processedSection["FPFileExtension"] = extension?.toString();
                    processedSection["FPFileName"] = file_name;
                    processedSection[key] = fileValue.name;
                }
            }

            const merged = {
                ...(selectedProfile ?? {}),
                ...processedSection
            };

            handleSaveForm?.(JSON.stringify([merged]), id);
        } catch (error) {
            console.error("Failed to save settings form property data", error);
        }
    };

    // Builds profile payload from current in-form control values.
    const buildProfileData = (): Record<string, unknown> | IFormData => {
        const updatedValues =
            updatedValuesRef.current ?? selectedProfile;

        if (!updatedValues) {
            return isAddressFormRequired
                ? { TableSections: {} }
                : {};
        }

        // Address form mode
        if (isAddressFormRequired) {
            const formData: IFormData = {
                TableSections: {}
            };

            for (const col of controls ?? []) {
                const sectionName =
                    col.DisplayGroupControl ?? "Default";

                let value: unknown;
                let found = false;

                /*
                 * Format from updatedValuesRef.current:
                 *
                 * Contact Details_ContactName_0_0_0
                 * User Details_IsNZ_0_0_0
                 */
                const refKeyPrefix =
                    `${sectionName}_${col.Name}_`;

                const refKey = Object.keys(updatedValues).find(key =>
                    key.startsWith(refKeyPrefix)
                );

                if (refKey) {
                    value = updatedValues[refKey];
                    found = true;
                } else {
                    /*
                     * Format from selectedProfile:
                     *
                     * ContactDetails_ContactName
                     * UserDetails_IsNZ
                     * UserDetails__User
                     */
                    const sectionKey =
                        sectionName.replace(/\s+/g, "");

                    const selectedProfileKey =
                        `${sectionKey}_${col.Name}`;

                    if (
                        Object.prototype.hasOwnProperty.call(
                            updatedValues,
                            selectedProfileKey
                        )
                    ) {
                        value = updatedValues[selectedProfileKey];
                        found = true;
                    }
                }

                if (!found) continue;

                if (!formData.TableSections[sectionName]) {
                    formData.TableSections[sectionName] = {};
                }

                formData.TableSections[sectionName][col.Name] =
                    value !== "" ? value : undefined;
            }

            return formData;
        }

        // Existing behavior - unchanged
        const profileData: Record<string, unknown> = {};

        for (const col of controls ?? []) {
            const classKeyPrefix =
                `${col.DisplayGroupControl ?? "Default"}_${col.Name}_`;

            const key = Object.keys(updatedValues).find(k =>
                k.startsWith(classKeyPrefix)
            );

            if (!key) continue;

            const value = updatedValues[key];

            profileData[col.Name] =
                value !== "" ? value : undefined;
        }

        return profileData;
    };

    // Forwards header action clicks with built or selected profile data.
    const handleActionClick = (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ): void => {
        const builtProfileData = buildProfileData();
        const profileData = !Object.keys(builtProfileData).length && selectedProfile
            ? selectedProfile
            : builtProfileData;
        handleActionImageClick?.(event, actionCode, profileData);
    };

    // Merges built, selected, and external grid values then saves the form.
    const handleSaveClick = (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ): void => {
        const builtProfileData = buildProfileData();

        const profileWithSelected = !isAddressFormRequired && id && selectedProfile
            ? { ...selectedProfile, ...builtProfileData }
            : builtProfileData;

        let profileData = !isAddressFormRequired && Object.keys(updatedValuesExternal).length
            ? { ...profileWithSelected, ...updatedValuesExternal }
            : profileWithSelected;

        if (isAddressFormRequired && updatedAddress) {
            const addressFormControl = controlsToRenderExternal?.find(
                control =>
                    control.DisplayControl === DisplayControlEnums.AddressForm
            );

            const addressSectionName =
                addressFormControl?.DisplayGroupControl;

            if (addressSectionName) {
                const formData = profileData as unknown as IFormData;

                formData.TableSections = {
                    ...(formData.TableSections ?? {}),
                    [addressSectionName]: {
                        ...(formData.TableSections?.[addressSectionName] ?? {}),
                        Address1: updatedAddress.Address1 ?? "",
                        Address2: updatedAddress.Address2 ?? "",
                        City: updatedAddress.City ?? "",
                        State: updatedAddress.State ?? "",
                        Country: updatedAddress.Country ?? "",
                        Zip: updatedAddress.Zip ?? "",
                        GPS:
                            updatedAddress.Latitude && updatedAddress.Longitude
                                ? `${updatedAddress.Latitude},${updatedAddress.Longitude}`
                                : ""
                    }
                };

                profileData = formData;
            }
        }
        handleSaveForm?.(
            JSON.stringify(isAddressFormRequired ? profileData : [profileData]),
            id
        );
    };

    // Validates required controls against current form values.
    const isValidForm = (values: Record<string, unknown>) => {
        if (!values) return false;
        const updatedKeys = Object.keys(values);
        const hasInvalidRequired = controls?.some((col) => {
            const classKeyPrefix = `${col.DisplayGroupControl ?? "Default"}_${col.Name}_`;
            const classKey = updatedKeys.find(k => k.startsWith(classKeyPrefix));
            if (!classKey) return false;
            const value = values[classKey];
            return col.IsRequired && (value === "" || value === null || value === undefined);
        });
        return !hasInvalidRequired;
    };

    // Tracks libform value changes and toggles manual save icon visibility.
    const handleOnValueChange = (values: Record<string, unknown>) => {
        updatedValuesRef.current = values;
        if (allowShowHeader && !isAutoSave && !isFormValueChangedExternal) {
            FnHideShowSaveIconForForm(
                isValidForm(values) ? 'show' : 'hide'
            );
        }
        handleValueChangeExternal?.(values);
    };

    // Merges external JSON grid edits into save payload state.
    const handleOnGridValueChange = (records: Record<string, unknown>[], name: string, isDefault?: boolean) => {
        if (!name) return;

        setUpdatedValuesExternal((prev) => ({
            ...prev,
            [name]: records
        }));

        if ((!isDefault || isFormValueChangedExternal) && allowShowHeader && !isAutoSave) {
            FnHideShowSaveIconForForm('show');
        }
    };

    const handleValueChangeAddress = (address: IAddress) => {
        // Check whether address actually changed
        const isAddressChanged =
            JSON.stringify(updatedAddress) !== JSON.stringify(address);

        // No address change → don't update save button
        if (!isAddressChanged) return;

        setUpdatedAddress(address);

        if (
            isAddressFormRequired &&
            allowShowHeader &&
            !isAutoSave
        ) {
            const valuesToValidate =
                updatedValuesRef.current ?? selectedProfile;

            if (valuesToValidate) {
                FnHideShowSaveIconForForm(
                    isValidForm(valuesToValidate)
                        ? "show"
                        : "hide"
                );
            }
        }
    };

    const renderedFormElements = useMemo(() => {
        if (!formElements) return undefined;

        return {
            ...formElements,
            onSave: isAutoSave || allowShowHeader || isDisableForm ? undefined : handleSavePropertyForm
        };
    }, [formElements, isAutoSave, allowShowHeader, isDisableForm]);

    const saveImageData: IImage = {
        source: <Save24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-1)',
        tooltip: "Click to save form",
        uniqueName: `${uniqueName}-isave`,
        type: 'svg'
    };

    const testApiImageData: IImage = {
        source: <TestAPI24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-1)',
        tooltip: "Click to test Api",
        uniqueName: `${uniqueName}-itestapi`,
        type: 'svg'
    };

    const helpImageData: IImage = {
        source: <Help24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-1)',
        tooltip: "Click to get Help",
        uniqueName: `${uniqueName}-ihelp`,
        type: 'svg'
    };

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading form...</div>;
    }

    if (!formElements || !Object.keys(formElements.TableSections).length) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No form found</div>;
    }

    return (
        <div className='nz-wh-100 nz-settings-lib-form-container'>
            {allowShowHeader && <div className='nz-form-action-header nz-sub-header'>
                <Label uniqueName={`${uniqueName}-h`} label={headerText ? headerText : id ? "Edit Form" : "Add Form"} fontSize='14px' />
                <div className='nz-form-header-action'>
                    {allowHelp
                        && <ActionImage uniqueName={`${uniqueName}-ai-help`}
                            image={helpImageData} w={'var(--node_height)'}
                            h={'var(--node_height)'}
                            handleMouse={handleActionClick} actionCode={'help'} />}
                    {(!isAutoSave || isAddressFormRequired) &&
                        <div className='nz-form-header-action-save nz-save-yellow-background' style={{ display: isFormValueChangedExternal ? 'block' : 'none' }}>
                            <ActionImage uniqueName={`${uniqueName}-ai`} image={saveImageData} w={'var(--node_height)'} h={'var(--node_height)'} handleMouse={handleSaveClick} actionCode={''} />
                        </div>}
                    {allowTestIcon
                        && <ActionImage uniqueName={`${uniqueName}-ai-test`}
                            image={testApiImageData} w={'var(--node_height)'}
                            h={'var(--node_height)'}
                            handleMouse={handleActionClick} actionCode={'testapi'} />}
                </div>
            </div>}
            <div className={'nz-settings-lib-form-content' + (controlsToRenderExternal?.length ? " nz-setting-lib-form-external-scroll" : "")}>

                <div className='nz-settings-lib-form-controls'>
                    {showOverlay && <div className={"nz-overlay" + (showOverlay ? " active" : "")} id="nzOverlay">
                        <div className="nz-overlay-message">
                            Saved
                        </div>
                    </div>}
                    {renderedFormElements ? <FormElementsRenderer formElements={renderedFormElements} onValuesChange={handleOnValueChange} /> : <></>}
                </div>
                {controlsToRenderExternal?.length ? (
                    <div className='nz-external-controls-container'>
                        {controlsToRenderExternal.map((control) => {
                            const value = getExternalControlValue(control, selectedProfile);

                            switch (control.DisplayControl) {
                                case DisplayControlEnums.JsonViewerControl:
                                    return (
                                        <JsonViewerControl
                                            key={control._AP}
                                            uniqueName={control._AP}
                                            label={control.PropertyLabel}
                                            isRenderAsForm={true}
                                            value={jsonForView ? JSON.stringify(jsonForView) : ""}
                                            isRequired={control.IsRequired === 1 || false}
                                            nameDesc={control.NameDesc}
                                            tooltip={control.ValueDesc}
                                            valueDesc={control.ValueDesc}
                                            inputMask={control.InputMask || ""}
                                            containerName={uniqueName}
                                        />
                                    );
                                case DisplayControlEnums.jsonPropertyGridRW:
                                    return <OneToManyPropertyFormWithGrid
                                        uniqueName={control.Name}
                                        headerText={control.PropertyLabel}
                                        propertyData={value as string | Record<string, unknown>[]}
                                        allowAdd={true}
                                        allowEdit={true}
                                        allowDelete={true}
                                        handleValueChange={handleOnGridValueChange} />
                                case DisplayControlEnums.jsonPropertyGridAdd:
                                    return <OneToManyPropertyFormWithGrid
                                        uniqueName={control.Name}
                                        headerText={control.PropertyLabel}
                                        propertyData={value as string | Record<string, unknown>[]}
                                        allowAdd={true}
                                        allowEdit={false}
                                        allowDelete={false}
                                        handleValueChange={handleOnGridValueChange} />
                                case DisplayControlEnums.AddressForm: {
                                    return (
                                        <AddressForm
                                            key={control.Name}
                                            initialAddress={updatedAddress}
                                            onChange={handleValueChangeAddress}
                                            showDerivedFields={false}
                                        />
                                    );
                                }
                                default:
                                    return null;
                            }
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export { SettingsLibForm };
export type { ISettingsLibForm, IControl, IControlProperties, IEnabledApiResult, IIsAuthorizedResponse };
