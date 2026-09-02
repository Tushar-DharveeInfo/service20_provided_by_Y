


import { AddressForm, FormElementsRenderer, IAddress, IFormData, IFormElements } from '@n20a/libform'
import '@n20a/libform/style.css'
import './PropertyFormContainer.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStatusBarContext } from '../../context/hooks/StatusBarHooks'
import { FnNodeGetKebabMenuData } from '../../allcommon/settingsform/FnNodeGetKebabMenuData'
import { FnBuildFormElementsFromDataset } from '../../allcommon/sidebar/FnBuildFormElementsFromDataset'
import { useMainAppContext } from '../../context/hooks/MainAppHooks'
import { Label } from '../../basic/label/Label'
import { IImage } from '../../allinterface/basic/IImage'
import { Back24x24, Save24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../allcommon/FnGetCssVariable'
import { DirtyFlagImage } from '../../basic/dirtyflagimage/DirtyFlagImage'
import { getDiagnosticLevelData } from '../../context/contextandprovider/CommonVariable'
import { ActionImage } from '../../basic/actionimage/ActionImage'
import { useSelectedNodeContext } from '../../context/hooks/SelectedNodeHooks'
import { ISelectedNodeProperty } from '../../context/allinterface/ISelectedNode'
import { useSessionContext } from '../../context/hooks/SessionHooks'
import { FnParseJsonSafely } from '../../../appcontainer/allcommon/FnParseJsonSafely'
import { FnCheckPermissionToEditName, IFeaturePermission } from '../../allcommon/FnCheckPermissionToEditName'
import getTableVsPropertySample from '../../../../serviceSampledata/sidebar/GetTableVsPropertySample.json'
import { ITreeNode } from '../../allinterface/entity/ITreeNode'
import { IMenuItem } from '../../allinterface/menu/IMainMenu'
import { IPropertyColumn } from '../../allinterface/sidebar/IPropertyFormContainer'

const samplePropertyEntityTables = getTableVsPropertySample.data;

const addressFieldNames = new Set([
    "address1",
    "address2",
    "city",
    "state",
    "country",
    "zip",
    "gps"
]);
interface IPropertyFormContainer {
    uniqueName: string; // A unique identifier for the dc property
    featureId: string;
    selectedNode: ITreeNode;
    selectedNodeMenu: IMenuItem | undefined// selected nodemenu data
    subTreeFeatureId?: string;
    featureData?: any[]; // feature data
    pgTableToShow?: string;
    showPgTableOneToOne?: boolean;
    treeData?: ITreeNode[];
    allowBackButton?: boolean;
    allowCloseButton?: boolean;
    isAllowCustomAction?: boolean;
    isReadOnly?: boolean;
    allowLog?: boolean;
    kebabMenuData?: Record<string, Record<string, any>[]>;
    entityTables?: Record<string, unknown>[];
    handlePropertyChange?: (propertyData?: Record<string, any>) => boolean;
    handleValueChange?: (value: any, EntID: string, event: unknown, selectedData: unknown, instanceName?: string) => void; // ap form value change
    handleRefreshUpdatedRecord?: (newAddedId: string, newAddedName: string, action?: 'save' | 'back') => void;
}

type IEntityTable = Record<string, unknown>;
type IPropertyRow = Record<string, unknown>;
type IKebabMenuData = Record<string, IPropertyRow[]>;
type IPgColumnDef = { PName: string; RequiredToAddRecord?: boolean; RequiredToUpdateRecord?: boolean;[key: string]: unknown };

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

// Parses property column definitions from a JSON properties string.
const parsePropertyColumns = (properties: string): IPropertyColumn[] =>
    FnParseJsonSafely<IPropertyColumn[], IPropertyColumn[]>(properties, { fallback: [] });

// Parses pg column definitions including required-field flags from a JSON string.
const parsePgColumnDefs = (properties: string): IPgColumnDef[] =>
    FnParseJsonSafely<IPgColumnDef[], IPgColumnDef[]>(properties, { fallback: [] });



const PropertyFormContainer = (propertyFormContainerProps: IPropertyFormContainer) => {
    const [entityTables, setEntityTables] = useState<IEntityTable[]>([]);
    const [formElements, setFormElements] = useState<IFormElements>();
    const [pgClassRecord, setPgClassRecord] = useState<IEntityTable>();
    const [pgRecord, setPgRecord] = useState<IEntityTable>();
    const [kebabMenuData, setKebabMenuData] = useState<IKebabMenuData>();
    const [oneToManyTableData, setOneToManyTableData] = useState<IPropertyRow[]>();
    const [isOneToManyPgTable, setIsOneToManyPgTable] = useState<boolean>(false);
    const [isShowMainHeader, setIsShowMainHeader] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [updatedProperties, setUpdatedProperties] = useState<Record<string, unknown>>();
    const [updatedAddress, setUpdatedAddress] = useState<IAddress>();
    const [isAddressFormShow, setIsAddressFormShow] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const statusBarContext = useStatusBarContext();
    const mainAppContext = useMainAppContext();
    const selectedNodeContext = useSelectedNodeContext();
    const sessionContext = useSessionContext();
    const { NodeEntityname } = propertyFormContainerProps.selectedNode;
    const {
        selectedNode,
        selectedNodeMenu,
        featureId,
        pgTableToShow,
        showPgTableOneToOne,
        allowBackButton,
        handleRefreshUpdatedRecord
    } = propertyFormContainerProps;
    const isShowPgTableFirst = !!selectedNodeMenu;
    const requestIdRef = useRef(0);
    const [entityTablesEntityName, setEntityTablesEntityName] = useState<string>();

    // Fetches entity table definitions for the selected node entity.
    useEffect(() => {
        if (!NodeEntityname) {
            setEntityTables([]);
            setEntityTablesEntityName(undefined);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setEntityTables([]);
        setEntityTablesEntityName(undefined);
        setLoading(true);
        requestIdRef.current++;

        // SAMPLE DATA: EM.GetTableVsProperty API commented out.
        // Prefer entityTables passed from SidebarContent (key/value EditText form).
        // axiosInterceptor({ url: EM.GetTableVsProperty, data: { entityName: NodeEntityname }, ... });
        if (!cancelled) {
            const tables =
                propertyFormContainerProps.entityTables?.length
                    ? propertyFormContainerProps.entityTables
                    : (samplePropertyEntityTables as IEntityTable[]);
            setEntityTables(tables);
            setEntityTablesEntityName(NodeEntityname);
            setLoading(false);
        }

        return () => {
            cancelled = true;
            requestIdRef.current++;
        };
    }, [NodeEntityname, propertyFormContainerProps.entityTables]);

    // Toggles the main header based on custom action allowance.
    useEffect(() => {
        if (propertyFormContainerProps.isAllowCustomAction) {
            setIsShowMainHeader(true);
        } else {
            setIsShowMainHeader(false);
        }
    }, [propertyFormContainerProps.isAllowCustomAction]);

    // Derives stable selected-node identifiers used for kebab menu and form loading.
    const selectedNodeKey = useMemo(() => ({
        entId: selectedNode?.NodeEntID?.includes("00000000") ? selectedNode.EntID : selectedNode?.NodeEntID,
        type: selectedNode?.treetype,
        nodeType: selectedNode?.NodeType,
        parentEntId: selectedNode?.parentEntID,
        entityName: selectedNode?.NodeEntityname,
    }), [
        selectedNode?.EntID,
        selectedNode?.NodeEntID,
        selectedNode?.treetype,
        selectedNode?.parentEntID,
        selectedNode?.NodeEntityname,
        selectedNode?.NodeType

    ]);

    const userBasicRole = useMemo(() => {
        return sessionContext.SessionList.find((item) => item.VariableName.toLowerCase() === "loginuserbasicrolename")?.SessionValue
    }, [sessionContext.SessionList])

    // Resolves the pg class table from entity tables based on node type.
    const pgClassTable = useMemo(() => {
        if (!entityTables.length) return undefined;
        return entityTables.find(t => t.entityPgClass);
    }, [entityTables, selectedNodeKey.type]);

    // Resolves the pg table from menu selection or explicit pgTableToShow prop.
    const pgTable = useMemo(() => {
        if (selectedNodeMenu?.Name) {
            return entityTables.find(
                t => String(t.tableName ?? "").toLowerCase() === selectedNodeMenu.Name.toLowerCase()
            );
        }
        if (pgTableToShow) {
            return entityTables.find(
                t => String(t.tableName ?? "").toLowerCase() === pgTableToShow.toLowerCase()
            );
        }
        return undefined;
    }, [entityTables, selectedNodeMenu?.Name, pgTableToShow]);

    // Determines whether the property form should be read-only for this context.
    const isReadOnly = useMemo(() => {
        return (
            propertyFormContainerProps.isReadOnly
        );
    }, [featureId, selectedNodeKey, propertyFormContainerProps.isReadOnly]);

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

    // Loads kebab menu data and builds form elements for the active pg tables.
    const loadForm = async () => {
        if (!pgClassTable?.properties || !selectedNodeKey.entityName) {
            setLoading(false);
            return;
        }
        const requestId = ++requestIdRef.current;
        setLoading(true);
        try {
            const columns = parsePropertyColumns(String(pgClassTable.properties));
            const pgColumns = pgTable?.properties
                ? parsePropertyColumns(String(pgTable.properties))
                : [];

            const addressControls = pgColumns.filter(control =>
                addressFieldNames.has(control.PName?.toLowerCase() ?? "")
            );

            // Remove address controls from normal controls
            const pgControlsForForm = pgColumns.filter(control =>
                !addressFieldNames.has(control.PName?.toLowerCase() ?? "")
            );
            const isOneToMany = pgTable?.isOneToManyRelation ? true : false;
            const nodeEntID = selectedNodeKey.entId;
            const kebabMenuPayload: Record<string, unknown> = {
                entID: nodeEntID?.includes("##")
                    ? nodeEntID.split("##")[0]
                    : nodeEntID,
                entityName: selectedNodeKey.entityName,
                kebabMenuTableName:
                    String(pgClassTable.tableName) +
                    (pgTable?.tableName ? `;${pgTable.tableName}` : "")
            };


            const kebabData = (
                await FnNodeGetKebabMenuData(
                    kebabMenuPayload,
                    statusBarContext
                )
            ) as IKebabMenuData;
            if (requestId !== requestIdRef.current) return;
            if (pgClassTable.isOneToManyRelation) {
                setIsOneToManyPgTable(true);
                setOneToManyTableData(kebabData[String(pgClassTable.tableName)] ?? []);
                setIsShowMainHeader(false);
                setFormElements(undefined);
                setPgClassRecord(undefined);
                setPgRecord(pgClassTable);
                return;
            } else if (!propertyFormContainerProps.showPgTableOneToOne && isOneToMany && pgTable?.tableName && Object.keys(kebabData)?.length > 1) {
                const onetToManyTable = kebabData[String(pgTable.tableName)];
                setIsOneToManyPgTable(true);
                setOneToManyTableData(onetToManyTable ?? []);
            } else {
                if (typeof kebabData === "object" && Object.values(kebabData)?.length) {
                    const record = Object.values(kebabData as Record<string, ISelectedNodeProperty[]>)?.[0]?.[0];
                    // selectedNodeContext.setSelectedNodeProperty(record as ISelectedNodeProperty);
                }
                setIsOneToManyPgTable(false);
                setOneToManyTableData(undefined);
            }
            if (addressControls.length) {
                const getProfileValue = (fieldName: string): string => {
                    if (!pgTable) return "";
                    const tableData =
                        kebabData[String(pgTable.tableName)];

                    if (!tableData) return "";

                    // Handle both formats:
                    // 1. [{ Address1: "...", GPS: "..." }]
                    // 2. { Address1: "...", GPS: "..." }
                    const parsedAddressData = Array.isArray(tableData)
                        ? tableData[0]
                        : tableData;

                    if (!parsedAddressData) return "";

                    // Exact key first
                    if (parsedAddressData[fieldName] != null) {
                        return String(parsedAddressData[fieldName]);
                    }

                    // Find dynamic/prefixed key
                    // e.g. ContactDetails_Address1
                    const matchedKey = Object.keys(parsedAddressData).find(
                        key =>
                            key.toLowerCase().endsWith(
                                `_${fieldName.toLowerCase()}`
                            )
                    );

                    return matchedKey
                        ? String(parsedAddressData[matchedKey] ?? "")
                        : "";
                };
                let addressValue: IAddress;

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
                setUpdatedAddress(addressValue);
                setIsAddressFormShow(true);
            }
            setPgClassRecord(pgClassTable);
            setPgRecord(pgTable);
            setKebabMenuData(kebabData);
            const form = FnBuildFormElementsFromDataset(
                isShowMainHeader || addressControls.length ? "" : "Properties",
                {
                    [String(pgClassTable.tableName)]: {
                        label: String(pgClassTable.tableLabel || pgClassTable.tableName),
                        columns
                    },
                    ...(pgTable?.tableName && (!pgTable.isOneToManyRelation || showPgTableOneToOne)
                        ? {
                            [String(pgTable.tableName)]: {
                                label: String(pgTable.tableLabel || pgTable.tableName),
                                columns: pgControlsForForm
                            }
                        }
                        : {})
                },
                kebabData,
                statusBarContext,
                mainAppContext.refTableRecords,
                "", // getMuForSite(), 
                getDiagnosticLevelData(),
                isReadOnly,
                isShowPgTableFirst ? String(pgTable?.tableName) : undefined,
                selectedNodeKey.entityName ?? undefined,
                undefined,
                undefined,
                undefined,
                isEditAllowedForFeature,
                userBasicRole ?? undefined
            );
            setFormElements(form);
        } catch (e) {
            console.error("Failed to load form", e);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    // Triggers form load when entity tables and pg class table are available for the current entity.
    useEffect(() => {
        if (entityTablesEntityName !== NodeEntityname) return;

        if (!entityTables.length || !pgClassTable) {
            setLoading(false);
            return;
        }
        setUpdatedAddress(undefined);
        setIsAddressFormShow(false);
        const abortController = new AbortController();

        const runLoadForm = async (): Promise<void> => {
            if (abortController.signal.aborted) return;
            await loadForm();
        };

        void runLoadForm();

        return () => {
            abortController.abort();
            requestIdRef.current++;
        };
    }, [entityTables, entityTablesEntityName, NodeEntityname, selectedNodeKey.entId,
        pgClassTable, pgTable, featureId, isEditAllowedForFeature,
        propertyFormContainerProps.kebabMenuData]);

    // Builds pg class data from updated property keys for a given table name.
    const buildPgClassDataFromKeys = (
        pgClassColumns: { PName: string }[],
        tableName: string,
        values: Record<string, unknown>
    ): IPropertyRow => {
        const pgClassData: IPropertyRow = {};
        const updatedKeys = Object.keys(values);
        pgClassColumns.forEach((col) => {
            const classKeyPrefix = `${tableName}_${col.PName}_`;
            const classKey = updatedKeys.find(k => k.startsWith(classKeyPrefix));
            if (classKey) {
                const value = values[classKey];
                pgClassData[col.PName] = value !== "" ? value : undefined;
            }
        });
        return pgClassData;
    };

    const areAllRequiredFieldsFilled = (
        values: Record<string, unknown>,
        formElement: IFormElements
    ): boolean => {
        const requiredFields = Object.values(
            formElement?.TableSections ?? {}
        )
            .flat()
            .filter(control => control.required && !control.disabled);

        return requiredFields.every(control => {
            // Exact key match
            let key = Object.prototype.hasOwnProperty.call(
                values,
                control.key
            )
                ? control.key
                : undefined;

            // Dynamic key match
            if (!key) {
                key = Object.keys(values).find(valueKey =>
                    valueKey.startsWith(control.key)
                );
            }

            if (!key) return false;

            const value = values[key];

            // null / undefined
            if (value === null || value === undefined) {
                return false;
            }

            // Empty string
            if (
                typeof value === "string" &&
                value.trim() === ""
            ) {
                return false;
            }

            return true;
        });
    };

    // Tracks dirty state and forwards merged pg class changes to the parent callback.
    const handleValueChange = (values: Record<string, unknown>) => {
        if (propertyFormContainerProps.handlePropertyChange) {
            if (!pgClassRecord?.properties) return;
            try {
                const pgClassColumns = parsePgColumnDefs(String(pgClassRecord.properties));
                const pgClassData = buildPgClassDataFromKeys(
                    pgClassColumns,
                    String(pgClassRecord.tableName),
                    values
                );
                const oldPgClassRow = kebabMenuData?.[String(pgClassRecord.tableName)]?.[0] ?? {};
                pgClassData["LastUpdated"] = undefined;
                const mergedPgClassRow = {
                    ...oldPgClassRow,
                    ...pgClassData
                };
                propertyFormContainerProps.handlePropertyChange(mergedPgClassRow);
            } catch (error) {
                console.error('Failed to map property change:', error);
            }
        }
        setUpdatedProperties(values);
        const isValid = formElements ? areAllRequiredFieldsFilled(
            values,
            formElements
        ) : false;

        setIsDirty(isValid);
    };

    const savePgTable = (
        newAddedEntID: string,
        newAddedName?: string
    ) => {
    };

    // Saves dirty-flag property changes via add/update API with optional pg table follow-up.
    const handleSaveProperties = (
        _event: React.MouseEvent<HTMLDivElement>
    ) => {
        /*
     * No property changes, but address has changed.
     * Save only PG table.
     */
        if (
            !updatedProperties &&
            isAddressFormShow &&
            updatedAddress
        ) {
            const oldPgClassRow =
                kebabMenuData?.[
                String(pgClassRecord?.tableName)
                ]?.[0];

            const existingEntID =
                oldPgClassRow?.EntID as string;

            const existingName =
                oldPgClassRow?.[
                String(pgClassRecord?.tableName)
                ] as string;

            if (existingEntID) {
                savePgTable(
                    existingEntID,
                    existingName
                );
            }

            return;
        }
        if (!updatedProperties || !pgClassRecord?.properties) return;
        try {
            const pgClassColumns = parsePgColumnDefs(String(pgClassRecord.properties));

            const pgClassData = buildPgClassDataFromKeys(
                pgClassColumns,
                String(pgClassRecord.tableName),
                updatedProperties
            );
            const oldPgClassRow = kebabMenuData?.[String(pgClassRecord.tableName)]?.[0] ?? {};
            pgClassData["LastUpdated"] = undefined;


        } catch (error) {
            console.error("Failed to map properties", error);
        }
    };

    // Saves property form data via add/update API with forensic logging and pg table follow-up.
    const handleSavePropertyForm = (formData: IFormData) => {
        if (!formData?.TableSections || !Object.keys(formData?.TableSections).length || !pgClassRecord?.properties) return;
        const pgClassData: IPropertyRow = {};
        const pgData: IPropertyRow = {};
        try {
            const pgClassColumns = parsePropertyColumns(String(pgClassRecord.properties));
            const pgColumns = pgRecord?.properties
                ? parsePgColumnDefs(String(pgRecord.properties))
                : [];
            const pgClassUpdatedData = formData?.TableSections[String(pgClassRecord.tableLabel)];
            if (!pgClassUpdatedData || typeof pgClassUpdatedData !== "object") return;
            pgClassColumns.forEach((col) => {
                if (col.PName) {
                    const value = pgClassUpdatedData[col.PName];
                    pgClassData[col.PName] = value !== "" ? value : undefined;
                }
            });
            const oldPgClassRow = kebabMenuData?.[String(pgClassRecord.tableName)]?.[0] ?? {};
            pgClassData["LastUpdated"] = undefined;
            const mergedPgClassRow = {
                ...oldPgClassRow,
                ...pgClassData
            };
            const payload = {
                [String(pgClassRecord.tableName)]: [mergedPgClassRow]
            };
        } catch (error) {
            console.error("Failed to map properties", error);
        }
    };

    // Navigates back via the parent refresh callback when the close button is clicked.
    const handleClickX = () => {
        propertyFormContainerProps.handleRefreshUpdatedRecord?.("", "", 'back');
    };

    // Handles back button click by invoking the parent refresh callback.
    const handleBackClick = (
        _event?: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        _actionCode?: string,
        _payload?: unknown
    ): void => {
        handleRefreshUpdatedRecord?.("", "", 'back');
    };
    const handleValueChangeAddress = (address: IAddress) => {
        // Check whether address actually changed
        const isAddressChanged = updatedAddress &&
            JSON.stringify(updatedAddress) !== JSON.stringify(address);

        // No address change → don't update save button
        if (!isAddressChanged) return;

        setUpdatedAddress(address);
        if (updatedProperties) {
            const isValid = formElements ? areAllRequiredFieldsFilled(
                updatedProperties,
                formElements
            ) : false;

            setIsDirty(isValid);
        }
        else {
            setIsDirty(true);
        }
    };

    // Injects save and close handlers into form elements for the renderer.
    const renderedFormElements = useMemo(() => {
        if (!formElements) return undefined;
        console.log('formElements :', formElements);
        return {
            ...formElements,
            onSave: propertyFormContainerProps.handlePropertyChange || propertyFormContainerProps.isReadOnly || isAddressFormShow ? undefined : handleSavePropertyForm,
            onX: propertyFormContainerProps.allowCloseButton ? handleClickX : undefined
        };
    }, [formElements, isAddressFormShow]);

    const saveImageData: IImage = {
        source: <Save24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Save changes",
        uniqueName: 'user-profile-isave',
        type: 'svg'
    };
    const backImageData: IImage = {
        source: <Back24x24
            size={FnGetCssVariable('--image-size-1')}
            fill='none'
            strokeWidth={1} />,
        w: 'var(--image-size-2)',
        tooltip: "Click to go back",
        uniqueName: 'user-profile-iback',
        type: 'svg'
    };

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading properties...</div>;
    }

    if (!isOneToManyPgTable && (!formElements || !Object.keys(formElements.TableSections).length)) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No properties found</div>;
    }

    return (
        <div key={propertyFormContainerProps.uniqueName} className='nz-wh-100 nz-d-flex-column nz-prop-form-container'>
            {isShowMainHeader || isAddressFormShow ? <div className='nz-sub-header nz-prop-form-container-action'>
                <Label uniqueName={propertyFormContainerProps.uniqueName + 'header'} label={"Properties"} />
                <div className='nz-header-action'>
                    {allowBackButton ? <ActionImage
                        uniqueName={propertyFormContainerProps.uniqueName + 'back-icon'}
                        image={backImageData} w={'var(--node_height)'} h={'var(--node_height)'}
                        actionCode={'back'} handleMouse={handleBackClick} /> : <></>}
                    {isDirty && <div className={'nz-save-button'}>
                        <DirtyFlagImage uniqueName={propertyFormContainerProps.uniqueName + 'save-icon'}
                            isDirty={isDirty}
                            bgColor={"#FFFF99"}
                            image={saveImageData} w={'var(--node_height)'} h={'var(--node_height)'}
                            handleMouse={handleSaveProperties} />
                    </div>}
                </div>
            </div> : <></>}
            <div className={'nz-prop-form-content' + (isOneToManyPgTable || isAddressFormShow ? " nz-prop-form-with-onetomany-grid" : "")}
            >
                {renderedFormElements ? <FormElementsRenderer
                    formElements={renderedFormElements}
                    onValuesChange={handleValueChange}
                    embedded={isAddressFormShow ? true : false}
                /> : <></>}

                {updatedAddress && isAddressFormShow ? <div style={{ margin: "6px 0px" }}>
                    <AddressForm
                        key={"address-form"}
                        initialAddress={updatedAddress}
                        onChange={handleValueChangeAddress}
                        showDerivedFields={false}
                    />
                </div> : <></>}
            </div>
        </div>
    );
};

export { PropertyFormContainer };
export type { IPropertyFormContainer, IPropertyColumn };
