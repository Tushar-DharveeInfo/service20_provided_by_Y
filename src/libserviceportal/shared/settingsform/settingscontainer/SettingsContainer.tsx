
import React, { useEffect, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { useApProfileContext } from '../../context/hooks/ApProfileHooks.ts';
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks.ts';
import './SettingsContainer.css';
import { DeviceByModelComboFieldNames } from '../../alldefaultprops/basic/DefaultPropsComboBoxControl.ts';
import { SettingsCustomImplementedSubGroups } from '../../alldefaultprops/basic/DefaultPropsFormContainer.ts';
import { IControl } from '../settingslibform/SettingsLibForm.tsx';
import { IActionLabelItem } from '../../allinterface/basic/IActionLabelItem.ts';
import { SettingsInstanceList } from '../settingsinstancelist/SettingsInstanceList.tsx';
import { YesNoFormContainer } from '../../basic/yesnoformcontainer/YesNoFormContainer.tsx'
import { FnUpdateProfileStringForEnabled } from '../../allcommon/settingsform/FnUpdateProfileStringForEnabled.ts';
import { unstable_batchedUpdates } from 'react-dom';
import { SettingsLibForm } from '../settingslibform/SettingsLibForm.tsx';
import Help from '../../../features/appqa/help/Help.tsx';
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely.ts';
import { handleFormControlsKeyDown, handleFormControlsBubbleKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown';

interface ISettingsContainer {
    uniqueName: string; // Unique identifier for the form container
    formControls: IControl[]; // Array of form control configurations
    allowActionList: boolean; // Whether to show the action list or not
    allowShowHeader: boolean; // indicates whether to show header of form or not 
    allowFilter?: boolean;
    group?: string; // groupName Of selected subGroup name
    subGroup?: string; // subgroup name from selected node
    isDisableForm?: boolean; // Whether to disable or not 
    headerText?: string; // if provided it will show custom header text else it will show the header based on id
    actionLabelItems?: IActionLabelItem[]; // List of action labels for the action list control
    selectedActionLabelItem?: IActionLabelItem; // List of action labels for the action list control
    allowAdd?: boolean; // Flag to allow adding items in the action list
    allowTestApi?: boolean; // Flag to allow testapi items in the action list
    allowPreflight?: boolean; // Flag to allow preflight items in the action list
    allowDelete?: boolean; // Flag to allow deleting items in the action list
    showEditButton?: boolean; // Flag to show the edit button in the action list
    profileString?: string; // Serialized profile data for initializing form controls
    isAutoSave?: boolean; // Enables auto-save functionality
    featureId?: string; // Feature ID for tracking or identification purposes
    subFeatureId?: string; // Sub Feature ID for tracking or identification purposes
    id?: string; // ID for edit profile 
    optionalFromControls?: IControl[]; // Optional payload to be passed
    testApiJson?: Record<string, any>;
    allowHelp?: boolean;
    minDate?: Date;
    measurementUnit?: string;
    allowRecordLabel?: boolean;
    isAddressFormRequired?: boolean;
    handleValueChange?: (value: any, name: string | undefined, isDefault?: boolean | undefined) => Promise<boolean> | void; // if isAutoSave is true then it will be used to get updated data
    handleSaveAction?: (profileData: string, id?: string | undefined, isSilent?: boolean) => void; // This will be called if allowActionList===false 
    handleActionImageClick?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void; // To handle button click 
    handleAddClick?: (event: React.MouseEvent<any>, actionCode?: string, payload?: any) => void; // To handle button click 
}

const SettingsContainer = (formContainerProps: ISettingsContainer) => {
    const [controls, setControls] = useState<IControl[]>([]);
    const [actionListItems, setActionListItems] = useState<IActionLabelItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<IActionLabelItem | null>(null);
    const [isShowConfirmDialog, setIsShowConfirmDialog] = useState<boolean>(false);
    const [isShowOk, setIsShowOk] = useState<boolean>(false);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isNZ, setIsNZ] = useState<boolean>(false);
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [refDataObject, setRefDataObject] = useState<any[]>([]);
    const [isAddMode, setIsAddMode] = useState<boolean>(false);

    const statusBarContext = useStatusBarContext();
    const apProfileContext = useApProfileContext();
    const { formControls, actionLabelItems, allowActionList, optionalFromControls, subGroup } = formContainerProps; // Destructure formContainerProps
    useEffect(() => {
        // Update action list items only if the value changes
        if (allowActionList && actionLabelItems) {
            if (actionLabelItems.length > 0) {

                setActionListItems(prevItems =>
                    JSON.stringify(prevItems) !== JSON.stringify(actionLabelItems)
                        ? actionLabelItems
                        : prevItems
                );

                const selectedListItem = actionLabelItems[0];

                setSelectedItem(selectedListItem);
                setIsAddMode(false);
            }
            else {
                setActionListItems([]);
                setSelectedItem(null)
                setIsAddMode(true);
            }
        }
        // Update controls only if the value changes
        if (formControls.length > 0) {
            setIsAddMode(false);
            if (!actionLabelItems?.length && optionalFromControls) {
                setControls(optionalFromControls);
            } else {
                setControls(prevControls =>
                    JSON.stringify(prevControls) !== JSON.stringify(formControls)
                        ? formControls
                        : prevControls
                );
            }
        }
        return () => {
            setSelectedItem(null);
        }
    }, [formControls, actionLabelItems, subGroup, allowActionList, optionalFromControls]);



    useEffect(() => {
        const GetRefLibData = async (refName: string, uniqueName: string | null = null, manufacturer: string | null = null, equipmentType: string | null = null, id: string | null = null) => {
            // return new Promise<any[]>((resolve, reject) => {   // <-- note Promise<any[]> instead of Promise<any>
            //     const handleGetLibRefListApiResponse = (getLibRefListApiResponse: unknown) => {
            //         if (getLibRefListApiResponse && typeof getLibRefListApiResponse === "object" && 'jsonString' in getLibRefListApiResponse) {
            //             try {
            //                 const parsedData = JSON.parse((getLibRefListApiResponse as any).jsonString as string);
            //                 if (parsedData && Array.isArray(parsedData)) {
            //                     resolve(parsedData);
            //                 } else {
            //                     resolve([]);
            //                 }
            //             } catch (error) {
            //                 console.log('Error in hanlde reflist api response :', error);
            //                 resolve([]);
            //             }
            //         } else {
            //             resolve([]);
            //         }
            //     }
            //     axiosInterceptor({
            //         url: MISC.GetLibRefList,
            //         data: {
            //             groupName: refName,
            //             actualMfgAcronym: manufacturer ?? undefined,
            //             eqtype: equipmentType ?? undefined
            //         },
            //         setFetchData: handleGetLibRefListApiResponse
            //     }, statusBarContext)
            // });
            return []
        }
        const GetRefDataBasedOnSelection = async (controls: IControl[], parsedProfile: any, id: string | null, refDataObject: any[] | null = null) => {
            const refObjects: any[] = [];
            for (let index = 0; index < controls.length; index++) {
                const element = controls[index];
                if (element.InputMask && element._AP === DeviceByModelComboFieldNames.Manufacturer) {
                    if (refDataObject && refDataObject?.length > 0) {
                        const filterData = refDataObject.filter((item: any) => { return item.Name?.toLowerCase() === element.InputMask?.toLowerCase() })
                        if (filterData) {
                            refObjects.push(...filterData);
                        }
                    }
                    else {
                        const apiResult = await GetRefLibData(element.InputMask, element._AP, null
                            , null, id
                        );
                        if (apiResult) {
                            refObjects.push(...apiResult);
                        }
                    }

                }
                else if (element.InputMask && element._AP === DeviceByModelComboFieldNames.EquipmentType && parsedProfile && ((id && parsedProfile[DeviceByModelComboFieldNames.EquipmentType]) || parsedProfile[DeviceByModelComboFieldNames.Manufacturer])) {
                    let apiResult: any[] = [];
                    if (refDataObject && refDataObject?.length > 0) {
                        apiResult = refDataObject.filter((item: any) => { return item.Name?.toLowerCase() === element.InputMask?.toLowerCase() })
                    }
                    if (!apiResult.length) {
                        apiResult = await GetRefLibData(element.InputMask, element._AP, parsedProfile[DeviceByModelComboFieldNames.Manufacturer]
                            , null, id
                        );
                    }
                    if (apiResult) {
                        refObjects.push(...apiResult);
                    }

                }
                else if (element.InputMask && element._AP === DeviceByModelComboFieldNames.ProductNumber && parsedProfile && ((id && parsedProfile[DeviceByModelComboFieldNames.ProductNumber]) || (parsedProfile[DeviceByModelComboFieldNames.Manufacturer] && parsedProfile[DeviceByModelComboFieldNames.EquipmentType]))) {
                    const apiResult = await GetRefLibData(element.InputMask, element._AP, parsedProfile[DeviceByModelComboFieldNames.Manufacturer]
                        , parsedProfile[DeviceByModelComboFieldNames.EquipmentType], id
                    );
                    if (apiResult) {
                        refObjects.push(...apiResult);
                    }
                }
            }
            return refObjects;
        }
        const handleSelectedItemChange = async () => {
            if (selectedItem && selectedItem.profileString && selectedItem.profileString.length > 0) {
                const parsedProfile = FnParseJsonSafely(selectedItem.profileString);
                if (formContainerProps.subFeatureId === SettingsCustomImplementedSubGroups.DeviceByModel && controls.length > 0 && parsedProfile.length > 0) {
                    const refDataResult = await GetRefDataBasedOnSelection(controls, parsedProfile[0], selectedItem.actionCode);
                    setRefDataObject(refDataResult);
                }
                if (parsedProfile.length > 0 && (parsedProfile[0].IsNZ?.toString() === "1" || parsedProfile[0].IsNZ?.toString() === "true")) {
                    setIsNZ(true);
                }
                else {
                    setIsNZ(false);
                }

                if (parsedProfile.length > 0 && (parsedProfile[0].Enabled?.toString() === "1" || parsedProfile[0].Enabled?.toString() === "true")) {
                    setIsEnabled(true);
                }
                else {
                    setIsEnabled(false);
                }
            }
            else {
                if (formContainerProps.subFeatureId === SettingsCustomImplementedSubGroups.DeviceByModel && controls.length > 0) {
                    const refDataResult = await GetRefDataBasedOnSelection(controls, null, null);
                    setRefDataObject(refDataResult);
                }
                setIsNZ(false);
            }
        }
        handleSelectedItemChange();
    }, [selectedItem, controls, formContainerProps.subFeatureId])


    const handleActionImageClick = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => {

        if (formContainerProps.handleActionImageClick) {
            formContainerProps.handleActionImageClick(event, actionCode, payload);
        }
        else {
            setConfirmMessage("Button clicked");
            setIsShowOk(true);
            setIsShowConfirmDialog(true);
        }
    }


    const handleSaveForm = (profileData: string, id?: string | undefined) => {
        if (formContainerProps.allowActionList) {
            if (id) {
                const updatedRecords: IActionLabelItem[] = [];
                for (let index = 0; index < actionListItems.length; index++) {
                    const element = actionListItems[index];
                    if (element.RecID === id || element.actionCode === id) {
                        element.profileString = profileData;
                    }
                    updatedRecords.push(element);
                }
                setActionListItems([...updatedRecords]);
                // call api to update profile record
            }
            if (formContainerProps.handleSaveAction) {
                formContainerProps.handleSaveAction(profileData, id);
            }
            else {

                const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
                if (saveButton) {
                    saveButton.style.display = "none";
                }
            }
        }
        else {
            formContainerProps.handleSaveAction && formContainerProps.handleSaveAction(profileData, id);
        }
    }

    const handleSelectListItem = async (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string | undefined) => {
        // setSelectedItem(null);
        setIsAddMode(false);


        if (actionCode) {
            const filteredRecord = actionListItems.find((item) => { return item.actionCode === actionCode });
            if (filteredRecord) {

                filteredRecord.profileString = await FnUpdateProfileStringForEnabled(filteredRecord.profileString, filteredRecord.subGroupName);
                unstable_batchedUpdates(() => {
                    setSelectedItem(filteredRecord);
                    setActionListItems([...actionListItems]);
                    setControls([...controls]);
                })
            }
            else {
                setConfirmMessage("Record not found for actionCode : " + actionCode);
                setIsShowOk(true);
                setIsShowConfirmDialog(true);
            }
        }
        else {
            setConfirmMessage("actionCode not found");
            setIsShowOk(true);
            setIsShowConfirmDialog(true);
        }
    }

    const handleActionButtonClick = (event: any, actionCode?: string | undefined, payload?: any) => {
        if (actionCode === "add") {
            sessionStorage.setItem("focusedControl", "");

            setSelectedItem(null);
            setActionListItems(actionListItems);
            setRefDataObject([]);
            setIsAddMode(true);
            const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
            if (saveButton) {
                saveButton.style.display = "none";
            }
        }
        else if (actionCode === "delete" && selectedItem) {
            if (formContainerProps.handleActionImageClick) {
                formContainerProps.handleActionImageClick(event, actionCode, selectedItem);
            }
            else {
                setIsShowOk(false);
                setConfirmMessage("Are you sure to delete?");
                setIsShowConfirmDialog(true);
            }
        }
        else if (formContainerProps.handleActionImageClick && selectedItem) {
            formContainerProps.handleActionImageClick(event, actionCode, selectedItem);
        }
    }

    const handleValueChange = (
        value: any,
        name: string | undefined,
        isDefault?: boolean
    ): Promise<boolean> => {
        return Promise.resolve(
            formContainerProps.handleValueChange?.(value, name, isDefault) ?? false
        );
    };
    const handleYesButtonClick = () => {
        const handleApiCallApProfileDelete = (apDeleteResponse: unknown, status?: string) => {
            if (status === "200" && apDeleteResponse !== undefined) {
                apProfileContext.fetchApProfile(true, statusBarContext);
            }
        }
        // axiosInterceptor({
        //     url: AP.DeleteApInstance,
        //     data: { recID: selectedItem?.actionCode },
        //     setFetchData: handleApiCallApProfileDelete
        // }, statusBarContext);
        setIsShowConfirmDialog(false);

    }
    const handleNoButtonClick = () => {
        setIsShowConfirmDialog(false);
    }

    const handleShowMessage = (message: string, isShowOkOnly?: boolean | undefined) => {
        setConfirmMessage(message);
        setIsShowConfirmDialog(true);
        if (isShowOkOnly) {
            setIsShowOk(true);
        }
    }

    return (
        <div key={formContainerProps.uniqueName} className="nz-form-list-container" tabIndex={1} >
            {formContainerProps.allowHelp && selectedItem && <Help
                uniqueName={selectedItem.label}
                pdfUrl='/privatedocs/api.pdf'
                featureName={selectedItem.label}
                headerText={formContainerProps.headerText || selectedItem.label} />}

            {formContainerProps.allowActionList ?
                <Splitter tabIndex={-1} className={`nz-w-100 nz-h-100 ${formContainerProps.allowHelp ? " nz-hidden" : ""}`}>
                    <SplitterPanel tabIndex={-1} size={25} minSize={10} className="nz-d-flex-column nz-align-center nz-justify-center nz-pane-1">
                        <div className='nz-form-instance-container'>
                            {actionListItems && <SettingsInstanceList
                                uniqueName={`${formContainerProps.uniqueName}-alist`}
                                actionLabelItems={actionListItems}
                                isAddMode={isAddMode}
                                selectedItem={selectedItem || undefined}
                                allowFilter={formContainerProps.allowFilter}
                                handleSelectListItem={handleSelectListItem}
                                handleActionButtonClick={handleActionButtonClick}
                                allowAdd={formContainerProps.allowAdd || false}
                                allowDelete={formContainerProps.allowDelete || false}
                                showEditButton={formContainerProps.showEditButton || false}
                                allowTestApi={false}
                                allowPreflight={formContainerProps.allowPreflight}
                                disableAdd={selectedItem === null || false}
                                disableEdit={!selectedItem || isNZ}
                                disableDelete={!selectedItem || isNZ}
                                disableTestApi={!selectedItem || !isEnabled}
                                allowRecordLabel={formContainerProps.allowRecordLabel}
                            />}
                        </div></SplitterPanel>
                    <SplitterPanel tabIndex={-1} size={75} minSize={10} className="nz-d-flex-column nz-align-center">
                        <div
                            className='nz-form-controls-container'
                            onKeyDownCapture={handleFormControlsKeyDown}
                            onKeyDown={handleFormControlsBubbleKeyDown}
                        >
                            {controls.length > 0 && <SettingsLibForm
                                uniqueName={`${formContainerProps.uniqueName}-fc`}
                                controls={controls}
                                profileString={selectedItem?.profileString || (!formContainerProps.allowActionList ? formContainerProps.profileString : "")}
                                allowShowHeader={formContainerProps.allowShowHeader}
                                headerText={formContainerProps.headerText || selectedItem?.label ? `Edit ${selectedItem?.label}` : `Add ${formContainerProps.subGroup ?? "Form"}`}
                                handleSaveForm={handleSaveForm}
                                isAutoSave={formContainerProps.isAutoSave || false}
                                handleValueChange={handleValueChange}
                                featureId={formContainerProps.featureId}
                                subFeatureId={formContainerProps.subFeatureId}
                                refDataObject={refDataObject}
                                testApiJson={formContainerProps.testApiJson}
                                allowHelp={formContainerProps.allowHelp}
                                measurementUnit={formContainerProps.measurementUnit}
                                minDate={formContainerProps.minDate}
                                container={formContainerProps.subGroup}
                                allowTestIcon={formContainerProps.allowTestApi ? (selectedItem?.RecID || selectedItem?.actionCode || formContainerProps.id) ? true : false : false}
                                handleActionImageClick={handleActionImageClick}
                                id={selectedItem?.RecID || selectedItem?.actionCode || formContainerProps.id}
                                isDisableForm={formContainerProps.isDisableForm || false}
                                handleShowMessage={handleShowMessage} />}
                        </div>
                    </SplitterPanel>
                </Splitter>
                :
                <div
                    className={`nz-form-controls-container${formContainerProps.allowHelp ? " nz-hidden" : ""}`}
                    onKeyDownCapture={handleFormControlsKeyDown}
                    onKeyDown={handleFormControlsBubbleKeyDown}
                >
                    {controls.length > 0 && <SettingsLibForm
                        uniqueName={`${formContainerProps.uniqueName}-fc`}
                        controls={controls}
                        profileString={selectedItem?.profileString || (!formContainerProps.allowActionList ? formContainerProps.profileString : "")}
                        allowShowHeader={formContainerProps.allowShowHeader}
                        headerText={formContainerProps.headerText || selectedItem?.label || `Add ${formContainerProps.subGroup ?? "Form"}`}
                        handleSaveForm={handleSaveForm}
                        isAutoSave={formContainerProps.isAutoSave || false}
                        handleValueChange={handleValueChange}
                        featureId={formContainerProps.featureId}
                        subFeatureId={formContainerProps.subFeatureId}
                        refDataObject={refDataObject}
                        minDate={formContainerProps.minDate}
                        container={formContainerProps.subGroup}
                        measurementUnit={formContainerProps.measurementUnit}
                        allowTestIcon={formContainerProps.allowTestApi ? (selectedItem?.RecID || selectedItem?.actionCode || formContainerProps.id) ? true : false : false}
                        handleActionImageClick={handleActionImageClick}
                        id={selectedItem?.RecID || selectedItem?.actionCode || formContainerProps.id}
                        isDisableForm={formContainerProps.isDisableForm || false}
                        handleShowMessage={handleShowMessage} />}
                </div>
            }

            <YesNoFormContainer uniqueName={`${formContainerProps.uniqueName}-confirm`}
                isOpen={isShowConfirmDialog}
                message={confirmMessage}
                handleYesButtonClick={handleYesButtonClick}
                handleNoButtonClick={handleNoButtonClick}
                showOkButton={isShowOk}
                handleOkButtonClick={() => {
                    setIsShowConfirmDialog(false);
                }} />
        </div>
    )
}

export { SettingsContainer };
export type { ISettingsContainer };
