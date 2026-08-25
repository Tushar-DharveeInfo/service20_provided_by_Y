
import { useEffect, useMemo, useRef, useState } from "react";

import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";
import { IBasicGridColDef } from "../../allinterface/tablegrid/IBasicGrid";
import {
    FormElementsRenderer,
    IElementProfile,
    IFormData,
    IFormElements
} from "@n20a/libform";
import './OneToManyPropertyFormWithGrid.css';
import { BasicGrid } from "../../tablegrid/BasicGrid";
import { ICellRendererParams } from "ag-grid-community";
import { Label } from "../../basic/label/Label";
import { handleFormControlsBubbleKeyDown, handleFormControlsKeyDown } from "../../allcommon/basic/FnHandleContainerKeyDown";

interface IOneToManyPropertyFormWithGrid {
    uniqueName: string;
    headerText: string;
    propertyData: string | Record<string, any>[];
    allowAdd?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    handleValueChange?: (records: Record<string, any>[], name: string, isDefault?: boolean) => void;
}

type TableRow = Record<string, unknown> & {
    __internalId?: number;
};

const OneToManyPropertyFormWithGrid = (
    oneToManyProps: IOneToManyPropertyFormWithGrid
) => {
    const {
        uniqueName,
        headerText,
        propertyData,
        allowAdd,
        allowEdit,
        allowDelete
    } = oneToManyProps;

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [columnDefs, setColumnDefs] = useState<IBasicGridColDef[]>([]);
    const [tableData, setTableData] = useState<TableRow[]>([]);
    const [formElements, setFormElements] = useState<IFormElements>();
    const [formRenderKey, setFormRenderKey] = useState<number>(0);
    const [showForm, setShowForm] = useState<boolean>(!!allowAdd);

    const editingRowIdRef = useRef<number | null>(null);
    const elementProfilesRef = useRef<IElementProfile[]>([]);
    /*
     * Parse and prepare grid/form data whenever property data changes
     */
    useEffect(() => {
        setErrorMessage("");
        setColumnDefs([]);
        setTableData([]);
        setFormElements(undefined);

        try {
            const parsedData = typeof propertyData === "string" ? FnParseJsonSafely(propertyData) : propertyData;

            if (!Array.isArray(parsedData)) {
                setErrorMessage("Invalid property data format.");
                return;
            }

            if (!parsedData.length) {
                setErrorMessage("Property data not found to show Grid/Form.");
                return;
            }

            const firstRow = parsedData[0];

            if (
                !firstRow ||
                typeof firstRow !== "object" ||
                Array.isArray(firstRow)
            ) {
                setErrorMessage("Invalid row data format.");
                return;
            }

            const keys = Object.keys(firstRow);

            if (!keys.length) {
                setErrorMessage("No fields found to render.");
                return;
            }

            const generatedFormElements: IElementProfile[] = [];
            const generatedColumns: IBasicGridColDef[] = [];
            let isValueFound = false;
            keys.forEach((key, index) => {
                const value = firstRow[key as keyof typeof firstRow];

                generatedFormElements.push({
                    key: `${key}-${index}`,
                    field: key,
                    datatype: typeof value,
                    label: key,
                    displaycontrol: typeof value === "boolean"
                        ? "yesNo"
                        : "editText"
                });
                if (value) {
                    isValueFound = true;
                }

                generatedColumns.push({
                    field: key,
                    headerName: key,
                    cellDataType: typeof value === "boolean" ? "boolean" : "string",
                    flex: index === keys.length - 1 ? 1 : 0
                });
            });

            setFormElements(
                createFormElements(
                    generatedFormElements,
                    undefined,
                    "Add"
                )
            );
            elementProfilesRef.current = [
                ...generatedFormElements
            ];

            setColumnDefs(generatedColumns);
            if (isValueFound) {

                const tableRows = parsedData.map(
                    (item: TableRow, index: number) => ({
                        ...item,
                        __internalId: index + 1
                    })
                );
                notifyValueChange(tableRows, true)
                setTableData(tableRows);
            }
        } catch (error) {
            console.error("Error while parsing property data:", error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while loading data."
            );
        }
    }, [propertyData]);

    const notifyValueChange = (
        updatedRecords: TableRow[],
        isDefault?: boolean
    ): void => {

        oneToManyProps.handleValueChange?.(
            updatedRecords.map(
                ({ __internalId, ...rest }) => rest
            ),
            uniqueName,
            isDefault
        );
    };

    const handleSavePropertyForm = (
        data: IFormData
    ): void => {

        try {

            if (
                !data ||
                typeof data !== "object" ||
                !data.TableSections ||
                !data.TableSections.Default
            ) {
                console.error("Invalid form data.");
                return;
            }
            /*
             * Extract actual form values
             */
            const updatedRow: TableRow = {
                ...data.TableSections.Default
            };

            setTableData((prev) => {

                let updatedRecords: TableRow[] = [];

                /*
                 * Add mode
                 */
                if (editingRowIdRef.current === null) {

                    updatedRecords = [
                        ...prev,
                        {
                            ...updatedRow,
                            __internalId: Date.now()
                        }
                    ];
                }

                /*
                 * Edit mode
                 */
                else {

                    updatedRecords = prev.map((item) =>
                        item.__internalId === editingRowIdRef.current
                            ? {
                                ...updatedRow,
                                __internalId:
                                    editingRowIdRef.current
                            }
                            : item
                    );
                }

                /*
                 * Notify parent
                 */
                notifyValueChange(updatedRecords);

                return updatedRecords;
            });

            /*
             * Reset state
             */
            const wasEditMode =
                editingRowIdRef.current !== null;

            editingRowIdRef.current = null;

            /*
             * Hide form after edit if add not allowed
             */
            if (wasEditMode && !allowAdd) {
                setShowForm(false);
            }

            if (elementProfilesRef.current) {
                setFormElements(
                    createFormElements(
                        elementProfilesRef.current,
                        undefined,
                        "Add"
                    )
                );
                setFormRenderKey((prev) => prev + 1);
            }

        } catch (error) {

            console.error(
                "Error while saving property form:",
                error
            );
        }
    };

    const createFormElements = (elementProfiles: IElementProfile[],
        data?: TableRow,
        title: string = "Add"
    ): IFormElements => {

        const profiles: IElementProfile[] = elementProfiles.map((item) => ({
            ...item,
            defaultvalue:
                data?.[item.field] ??
                (
                    item.datatype === "boolean"
                        ? false
                        : ""
                )
        }));

        return {
            Title: title,
            TableSections: {
                Default: profiles
            },
            onSave: handleSavePropertyForm
        };
    };

    /*
     * Handle edit record
     */
    const handleEditRecord = (
        value?: ICellRendererParams
    ): void => {
        try {

            if (!value?.data || !elementProfilesRef.current?.length) {
                console.error(
                    "Edit action called without row data."
                );
                return;
            }

            const selectedRow = value.data as TableRow;
            if (selectedRow.__internalId)
                editingRowIdRef.current = selectedRow.__internalId;
            setShowForm(true);
            setFormElements(
                createFormElements(
                    elementProfilesRef.current,
                    selectedRow,
                    "Edit"
                )
            );
            setFormRenderKey((prev) => prev + 1);
        } catch (error) {

            console.error(
                "Error while editing record:",
                error
            );
        }
    };

    /*
     * Handle delete record
     */
    const handleDeleteRecord = (
        value?: ICellRendererParams
    ): void => {
        try {

            if (!value?.data) {
                console.warn(
                    "Delete action called without row data."
                );
                return;
            }

            const selectedRow = value.data as TableRow;

            setTableData((prev) => {

                const updatedRecords = prev.filter(
                    (item) =>
                        item.__internalId !==
                        selectedRow.__internalId
                );

                /*
                 * Notify parent
                 */
                notifyValueChange(updatedRecords);

                return updatedRecords;
            });

            /*
             * Reset edit form if same row deleted
             */
            if (
                editingRowIdRef.current ===
                selectedRow.__internalId
            ) {

                editingRowIdRef.current = null;
                if (!allowAdd) {
                    setShowForm(false);
                }
                if (elementProfilesRef.current?.length) {

                    setFormElements(
                        createFormElements(
                            elementProfilesRef.current,
                            undefined,
                            "Add"
                        )
                    );
                }
                setFormRenderKey((prev) => prev + 1);
            }

        } catch (error) {

            console.error(
                "Error while deleting record:",
                error
            );
        }

    };


    /*
     * Determine whether grid should render
     */
    const shouldShowGrid = useMemo(() => {
        return !!tableData.length || allowAdd;
    }, [tableData, allowAdd]);


    if (errorMessage) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">
                {errorMessage}
            </div>
        );
    }

    if (!shouldShowGrid) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left">
                Property details not found.
            </div>
        );
    }

    return (
        <div
            key={uniqueName}
            className="nz-wh-100 nz-one-to-many-property-form-with-grid"
        >
            {/* Header */}
            <div className="nz-one-to-many-property-form-header">
                <Label
                    uniqueName={`${uniqueName}-header-property-grid-form`}
                    label={headerText}
                />
            </div>

            {/* Form + Grid */}
            <div className="nz-one-to-many-property-form-content">
                <div className="nz-one-to-many-property-form" onKeyDownCapture={handleFormControlsKeyDown}
                    onKeyDown={handleFormControlsBubbleKeyDown}>

                    {/* Dynamic Form Renderer */}
                    {showForm && formElements && (
                        <FormElementsRenderer
                            key={formRenderKey}
                            formElements={formElements}
                            embedded={true}
                        />
                    )}
                </div>
                <div className="nz-one-to-many-property-grid">
                    {/* Data Grid */}
                    <BasicGrid
                        uniqueName={`${uniqueName}-property-grid`}
                        instanceName=""
                        containerName=""
                        showGrid={true}
                        rowData={tableData}
                        columnDefs={columnDefs}
                        allowEditButton={allowEdit}
                        allowDeleteButton={allowDelete}
                        handleMouseForEdit={handleEditRecord}
                        handleMouseForDelete={handleDeleteRecord}
                    />
                </div>
            </div>
        </div>
    );
};

export { OneToManyPropertyFormWithGrid };
export type { IOneToManyPropertyFormWithGrid };