
import { useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react';
import { IconButton } from '@mui/material';
import { CellClickedEvent, CellEditingStartedEvent, CellMouseDownEvent, CellValueChangedEvent, ColDef, Column, ColumnResizedEvent, GridOptions, GridReadyEvent, ICellRendererParams, PaginationChangedEvent, RowClickedEvent, RowNode, SelectionChangedEvent, ValueGetterParams } from 'ag-grid-community';
import "../allcss/tablegrid/BasicGrid.css"
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { copyDisplayedColumnsData, handleMouseEvent, handleResize, hideShowPaginatation, onGridReady, syncPaginationDisplay } from './GridEvent';
import { ContainerStyle, GridDefaults } from '../alldefaultprops/tablegrid/DefaultPropsBasicGrid';
import {
    IBasicGrid,
    IBasicGridColDef,
    IAutoSizeColumnDef,
    ICellEditingRowData,
    IColumnWidthEntry,
    IDataGridWidthPayload,
    IDescendingRowData,
    IExtendedBasicGridColDef,
    IGridRowWithSelection,
    IForensicLogPaginationPayload,
    TGridRow,
    TGridRowData,
} from '../allinterface/tablegrid/IBasicGrid';
import { FnCopyToClipboard } from '../allcommon/basic/FnCopyToClipboard';
import { ActionImage } from '../basic/actionimage/ActionImage';
import { Label } from '../basic/label/Label';
import { NodeMenu } from '../menu/nodemenu/NodeMenu'
import { Image } from '../basic/image/Image';
import { NodeHeight } from '../../appcontainer/alldefaultprops/DefaultPropsAppContainer';
import { IActionImageForSubMenu } from '../allinterface/basic/IActionImageList';
import { Copy24x24, Cross, Download24x24, Edit24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../appcontainer/allcommon/FnGetCssVariable';
import { FnGetSessionVariableFromStorage } from '../allcommon/basic/FnGetSessionVariableFromStorage';

// import { useSessionContext } from '../context/hooks/SessionHooks';
// import { sampleSessionContextFallback } from '../../../sampledata/sidebar/SampleContextFallbacks';
import { OptionsFilter } from '../basic/optionsfilter/OptionsFilter';
import { IOptionItem } from '../allinterface/basic/IOptionsFilter';

function isUtilityColumn(col: IBasicGridColDef): boolean {
    return !!(col.pinned || col.colId === 'index-cell');
}

function getLastVisibleDataColumnIndex(cols: IBasicGridColDef[]): number {
    let lastIndex = -1;
    cols.forEach((col, index) => {
        if (isUtilityColumn(col)) {
            return;
        }
        if (!col.hide) {
            lastIndex = index;
        }
    });
    return lastIndex;
}

function applyLastVisibleColumnFlex(cols: IBasicGridColDef[]): IBasicGridColDef[] {
    const lastVisibleIndex = getLastVisibleDataColumnIndex(cols);
    return cols.map((col, index) => {
        if (isUtilityColumn(col)) {
            return col;
        }
        const updated = { ...col };
        if (index === lastVisibleIndex) {
            updated.flex = 1;
            updated.resizable = false;
            updated.minWidth = 80
        } else if (updated.flex !== undefined) {
            delete updated.flex;
        }
        return updated;
    });
}

const BasicGrid = (gridProps: IBasicGrid) => {
    const gridRef = useRef<AgGridReact>(null);
    const [rowData, setRowData] = useState<TGridRowData>([]);
    const [columnDefs, setColumnDefs] = useState<IBasicGridColDef[]>([]);
    const [indexColumnAdded, setIndexColumnAdded] = useState<boolean>(false);
    const gridParentStyle = useMemo(() => (ContainerStyle), []);
    const sessionData = { SessionList: [] };
    const isColumnResizingRef = useRef(false);

    const [isLoading, setIsLoading] = useState(true);
    const [columnToggleList, setColumnToggleList] = useState<IOptionItem[]>([]);
    const [jumpToLastPageBtnClicked, setJumpToLastPageBtnClicked] = useState(false);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const defaultColDef: ColDef = useMemo(() => {
        return {
            filter: true,
            sortable: false,
            resizable: true,
            suppressMovable: true,
            cellClass: gridProps.allowAutoSizeColumn ? '' : 'nz-truncate-text',
        };
    }, [gridProps.allowAutoSizeColumn]);

    const lastMouseEvent = useRef<MouseEvent | null>(null);
    const gridOptions: GridOptions = {
        onCellEditingStarted: async (event: CellEditingStartedEvent) => {
            try {
                const editingRow = event.data as ICellEditingRowData | undefined;
                if (editingRow) {
                    editingRow.IsSaved = false;
                }

                const mouseEvent: MouseEvent | null =
                    (event.event instanceof MouseEvent ? event.event : null) || lastMouseEvent.current;

                if (!mouseEvent) {
                    return;
                }

                const agPopup = document.querySelector(".ag-popup-editor");
                if (!agPopup) {
                    return;
                }

                const gridContainer = document.querySelector(".nz-ag-container");
                if (!gridContainer) {
                    return;
                }
                const modelDiv = document.querySelector(`.nz-dialog-grid-container`);
                if (modelDiv) {
                    timeoutRef.current = setTimeout(() => {
                        // Calculate popup position
                        if (mouseEvent.target) {
                            if (modelDiv) {
                                if (mouseEvent.target instanceof Element) {
                                    const boundry = mouseEvent.target.getBoundingClientRect();
                                    const editorBundry = agPopup.getBoundingClientRect();
                                    const data = document.querySelector(
                                        `.ag-cell-popup-editing`
                                    );
                                    if (data) {
                                        const popupEditor =
                                            document.querySelector(".ag-popup-editor") as HTMLElement | null;
                                        if (popupEditor) {
                                            popupEditor.style.width = `${boundry.width}px`;
                                            popupEditor.style.left = `${boundry.left - editorBundry.left
                                                }px`;
                                        }
                                    }
                                }
                            } else {
                                const gridContainerRect = gridContainer.getBoundingClientRect();
                                const popupHeight = agPopup?.clientHeight || 0; // Height of the popup to calculate space
                                const spaceAbove =
                                    mouseEvent && mouseEvent?.clientY - gridContainerRect.top;
                                const spaceBelow =
                                    gridContainerRect.bottom - mouseEvent.clientY;

                                // Check if there's enough space below or if the space above is more
                                const isSpaceBelow = spaceBelow > spaceAbove;

                                const topOffset = isSpaceBelow
                                    ? mouseEvent && mouseEvent.clientY && mouseEvent.clientY
                                    : mouseEvent.clientY - popupHeight;

                                // Update popup position
                                const popupElement = agPopup as HTMLElement;
                                popupElement.style.top = `${topOffset}px`;

                                // Adjust height of checkedlistbox (if present)
                                const checkListDiv = document.querySelector(
                                    ".ag-popup-editor .flist-box"
                                );
                                if (checkListDiv) {
                                    const adjustedHeight = isSpaceBelow ? spaceBelow : spaceAbove;
                                    checkListDiv.setAttribute(
                                        "style",
                                        `max-height:${adjustedHeight}px;height:auto`
                                    );
                                }
                            }
                        }
                    }, 0);
                }
            } catch (error) {
                alert(`Error adjusting popup position: ${error}`);
            }
        },
    };

    useEffect(() => {
        // Add event listener on component mount
        window.addEventListener("resize", () => {
            handleResize(gridProps);
        });
        const handleMouseDown = (event: MouseEvent) => {
            lastMouseEvent.current = event;
        };

        document.addEventListener("mousedown", handleMouseDown);
        if (import.meta.env.PROD) {
            const originalWarn = console.warn;
            console.warn = (...args: unknown[]) => {
                if (String(args[0]).includes('AG Grid')) {
                    return;
                }
                originalWarn(...args);
            };
        }
        // Remove event listener on component unmount
        return () => {

            document.removeEventListener("mousedown", handleMouseDown);
            timeoutRef.current && clearTimeout(timeoutRef.current);
            window.removeEventListener('resize', () => {
                handleResize(gridProps);
            })
        };

    }, []);

    useEffect(() => {
        if (gridProps.rowData) {
            function limitRowData<T>(
                data: T[],
                limit: number = GridDefaults.numberOfShowAtOnce
            ): T[] {
                if (!Array.isArray(data)) return [];

                if (data.length <= limit) {
                    return data;
                }

                const limited: T[] = [];
                for (let i = 0; i < limit; i++) {
                    limited.push(data[i]);
                }
                return limited;
            }

            const rows = limitRowData<TGridRow>(
                Array.isArray(gridProps.rowData) ? (gridProps.rowData as TGridRow[]) : []
            );
            setRowData([...rows]);
        }

    }, [gridProps.rowData]);

    useEffect(() => {
        const api = gridProps.gridRef?.current?.api ?? gridRef?.current?.api;
        if (api) {
            syncPaginationDisplay(gridProps, api);
        }
    }, [gridProps.rowData, gridProps.totalRecords, gridProps.instanceName]);

    useEffect(() => {
        let timeOutServer: ReturnType<typeof setTimeout> | undefined;
        let timeOutPopupServer: ReturnType<typeof setTimeout> | undefined;
        const handleTabPress = (event: KeyboardEvent) => {
            if (event.key === "Tab") {
                const observePopupEditor = () => {
                    const popupEditor = document.querySelector('.ag-popup-editor') as HTMLDivElement;
                    const cellEditor = document.querySelector('.ag-cell-popup-editing') as HTMLDivElement;
                    const gridBody = document.querySelector('.ag-root') as HTMLDivElement;

                    if (!popupEditor || !cellEditor || !gridBody) return;

                    const rowRect = cellEditor.getBoundingClientRect();
                    const gridRect = gridBody.getBoundingClientRect();
                    const topOffset = rowRect.top - gridRect.top;

                    const computedStyles = window.getComputedStyle(cellEditor);
                    const width = computedStyles.width;

                    const overridePosition = () => {
                        popupEditor.style.setProperty('top', `calc(${topOffset}px - var(--spacing-0))`, 'important');
                        popupEditor.style.setProperty('width', width, 'important');
                    };

                    overridePosition();

                    const observer = new MutationObserver(() => {
                        overridePosition();
                    });

                    observer.observe(popupEditor, { attributes: true, attributeFilter: ['style'] });

                    timeOutServer = setTimeout(() => observer.disconnect(), 2000);
                };

                timeOutPopupServer = setTimeout(observePopupEditor, 0);
            }
        };

        window.addEventListener("keydown", handleTabPress);

        return () => {
            window.removeEventListener("keydown", handleTabPress);
            timeOutServer && clearTimeout(timeOutServer);
            timeOutPopupServer && clearTimeout(timeOutPopupServer);
        };
    }, []);

    useEffect(() => {
        if (isColumnResizingRef.current) {
            return;
        }
        if (gridProps?.columnDefs && gridProps?.columnDefs?.length > 0) {
            const columns: IBasicGridColDef[] = [];
            setIndexColumnAdded(true);
            if (!gridProps?.allowColumnResize) {
                if (gridProps?.columnDefs) {
                    gridProps?.columnDefs?.forEach((item: IBasicGridColDef) => {
                        item["resizable"] = item.resizable ? true : false;
                        if (item?.headerName?.toLowerCase() === "action" || item?.field?.toLowerCase() === "action") {
                            item["resizable"] = false;
                            item["headerName"] = "";
                            item["field"] = ""
                            item["suppressSizeToFit"] = true;
                            item["cellClass"] = "nz-index-cell";
                        }
                    });
                    gridProps.columnDefs[gridProps?.columnDefs?.length - 1]["resizable"] = false;
                }
            }
            if (gridProps.instanceName === "notes" || gridProps.instanceName === "nz_forcensic_log") {
                if (gridProps?.columnDefs) {
                    gridProps?.columnDefs.forEach((item) => {
                        if (item.field === "LastUpdated") {
                            item.sort = "desc"
                        }
                    })
                }
            }
            if (gridProps?.allowColumnResize) {
                gridProps?.columnDefs?.forEach((item, index, arr) => {
                    item.resizable = index !== arr.length - 1;

                });
            }
            if (gridProps?.allowSort) {
                gridProps?.columnDefs?.forEach((item) => {
                    item["sortable"] = true;
                });
            }
            if (gridProps?.allowEdit) {
                gridProps?.columnDefs?.forEach((item) => {
                    item["editable"] = true;
                });
            }
            if (gridProps?.allowDrag) {
                gridProps?.columnDefs.forEach((item) => {
                    item["suppressMovable"] = !gridProps?.allowDrag;
                });
            }
            if (gridProps?.checkboxSelection) {
                columns.push({
                    headerName: "",
                    width: 30,
                    filter: false,
                    sortable: false,
                    pinned: true,
                    field: "id1",
                    colId: "index-cell",
                    cellClass: "nz-index-cell",
                    resizable: false,
                    checkboxSelection: gridProps?.checkboxSelection
                        ? gridProps?.checkboxSelection
                        : false,
                });
            }
            if (gridProps?.allowFilter) {
                gridProps?.columnDefs?.forEach((item: IBasicGridColDef) => {
                    item["filter"] = true;
                });
            } else {
                gridProps?.columnDefs?.forEach((item: IBasicGridColDef) => {
                    item["filter"] = false;
                });
            }
            if (gridProps?.descRowNumber) {
                columns.push({
                    headerName: "",
                    field: "id2",
                    valueGetter: function (params: ValueGetterParams<TGridRow>) {
                        const rowCount = params.api.getDisplayedRowCount();
                        if (params && params.node && params.node.rowIndex != null) {
                            const descendingNumber = rowCount - params.node.rowIndex;
                            if (params.node.data) {
                                (params.node.data as IDescendingRowData).special = descendingNumber; // added property called special
                            }
                            return descendingNumber;
                        }
                    },
                    width: 60,
                    filter: false,
                    sortable: false,
                    pinned: true,
                    colId: "index-cell",
                    cellClass: "nz-index-cell",
                    resizable: false,
                    cellRenderer: (params: ICellRendererParams) => (
                        <Label label={params.value} uniqueName='rowNumber' />
                    ),
                });
            } else if (!gridProps?.rowNumber) {
                columns.push({
                    headerName: "",
                    field: "id3",
                    valueGetter: "node.rowIndex + 1",
                    width: gridProps.hideCopyRowIcon && !gridProps.allowEditButton && !gridProps.allowDeleteButton ? 60 : 60,
                    filter: false,
                    sortable: false,
                    pinned: true,
                    colId: "index-cell",
                    cellClass: "nz-index-cell",
                    resizable: false,
                    cellRenderer: (params: ICellRendererParams) => {
                        return (
                            <>
                                <div className='nz-grid-copy-icon-div'>
                                    {!gridProps.hideCopyRowIcon && <div className='nz-grid-copy-row-icon'>
                                        <ActionImage
                                            image={{
                                                uniqueName: "copy",
                                                source: <Copy24x24
                                                    size={FnGetCssVariable('--image-size-1')}
                                                    fill='none'
                                                    strokeWidth={1} />,
                                                type: "svg",
                                                w: "var(--image-size-1)",
                                                h: "var(--image-size-1)",
                                                tooltip: "Copy Data"
                                            }}
                                            uniqueName='copy'
                                            w='var(--node_height)'
                                            h='var(--node_height)'
                                            actionCode='copyRow'
                                            handleMouse={() => {
                                                copyRowRef.current(params.node as any)
                                            }}
                                        />
                                    </div>}
                                    <Label label={params.value} uniqueName='rowNumber-cell' />
                                </div>
                                <div className={`nz-right-mouse-action-cell nz-session-task-hide  ${gridProps?.hideRowKebabMenu === false || gridProps.allowEditButton || gridProps.allowDeleteButton ? 'nz-show-background' : ''}`}
                                >
                                    <div className='nz-right-mouse-action-cell-btn'>


                                        {/*We are using a right mouse menu component, but it has not been created yet. */}
                                        {gridProps?.hideRowKebabMenu === false && <NodeMenu
                                            key={params.node.id}
                                            uniqueName='basic-grid'
                                            container={gridProps.containerName || "data_grid"}
                                            selectedRow={params.data}
                                            featureId={gridProps.featureId}
                                            handleSelect={(value: IActionImageForSubMenu) => {
                                                gridProps.handleNodeMenuOnClick && gridProps.handleNodeMenuOnClick(value, params.data, gridProps.containerName)
                                            }}
                                            showIcon={true}
                                            featureData={gridProps?.featureData || []}
                                        />}
                                        <div className='nz-edit-delete-icon'>
                                            {gridProps.allowEditButton &&
                                                <ActionImage
                                                    image={{
                                                        uniqueName: "edit",
                                                        source: <Edit24x24
                                                            size={FnGetCssVariable('--image-size-2')}
                                                            fill='none'
                                                            strokeWidth={1} />,
                                                        type: "svg",
                                                        w: "var(--image-size-1)",
                                                        h: "var(--image-size-1)",
                                                        tooltip: "Click to edit"
                                                    }}
                                                    w='var(--node_height)'
                                                    uniqueName='editicon'
                                                    actionCode='edit click'
                                                    h='var(--node_height)'
                                                    handleMouse={() => {

                                                        if (gridProps.handleMouseForEdit) { gridProps.handleMouseForEdit(params) }
                                                    }}
                                                />}
                                            {
                                                gridProps.allowDeleteButton && <ActionImage
                                                    image={{
                                                        uniqueName: "cancel",
                                                        source: <Cross
                                                            size={FnGetCssVariable('--image-size-2')}
                                                            fill='red' />,
                                                        type: "svg",
                                                        w: "var(--image-size-1)",
                                                        h: "var(--image-size-1)",
                                                        tooltip: "Click to Delete"
                                                    }}
                                                    w='var(--node_height)'
                                                    actionCode='delete click'
                                                    uniqueName='deleteicon'
                                                    disabled={(params.data as IGridRowWithSelection | undefined)?.IsNZ ? true : false}
                                                    h='var(--node_height)'
                                                    handleMouse={() => {

                                                        if (gridProps.handleMouseForDelete) { gridProps.handleMouseForDelete(params) }
                                                    }}
                                                />
                                            }
                                        </div>
                                    </div>
                                </div>
                            </>
                        )
                    },
                });
            }

            if (gridProps.allowCheckBoxOnRow) {
                columns.push({
                    headerName: "",
                    suppressSizeToFit: true,
                    headerCheckboxSelection: gridProps.rowSelection === "single" ? false : true,
                    showDisabledCheckboxes: true,
                    colId: "index-cell",
                    field: "id5",
                    cellClass: "nz-index-cell",
                    resizable: false,
                    editable: false,
                    filter: false,
                    pinned: true,
                    width: 50,
                    checkboxSelection: () => {
                        const data = gridProps.gridRef ? gridProps.gridRef : gridRef
                        data.current?.api?.forEachNode((node: RowNode<TGridRow>) => {
                            const nodeData = node.data as IGridRowWithSelection | undefined;
                            node.setSelected(!!nodeData && (nodeData.selected === true || nodeData.Selected === true));
                        });
                        return true
                    }
                });
            }

            Array.prototype.push.apply(columns, gridProps?.columnDefs);
            const flexColumns = applyLastVisibleColumnFlex(columns);
            if (gridProps?.allowAutoSizeColumn) {
                if (gridProps.instanceName !== "CablingGrid") {
                    setAutoSizeColumnWidthRef.current(gridProps.rowData, flexColumns)
                }
                else {
                    setColumnDefs(flexColumns);
                }

            } else {
                setColumnDefs(flexColumns);
            }


        } else {
            setIndexColumnAdded(false);
            setColumnDefs(gridProps?.columnDefs ? gridProps?.columnDefs : []);
        }

    }, [gridProps?.columnDefs,
    gridProps?.rowData,
    gridProps?.allowColumnResize,
    gridProps?.allowSort,
    gridProps?.allowEdit,
    gridProps?.allowDrag,
    gridProps?.checkboxSelection,
    gridProps?.allowFilter,
    gridProps?.descRowNumber,
    gridProps?.rowNumber,
    gridProps?.hideCopyRowIcon,
    gridProps?.hideRowKebabMenu,
    gridProps?.allowEditButton,
    gridProps?.allowDeleteButton,
    gridProps?.instanceName,
    gridProps?.allowCheckBoxOnRow,
    gridProps?.rowSelection,
    gridProps?.allowAutoSizeColumn,
    gridProps?.containerName,
    gridProps?.featureId,
    gridProps?.featureData,
    gridProps?.handleNodeMenuOnClick,
    gridProps?.handleMouseForEdit,
    gridProps?.handleMouseForDelete,
    gridProps?.gridRef]);


    const setAutoSizeColumnWidth = async (autoSizeRowData: TGridRowData, columns: IBasicGridColDef[]) => {
        calculateColumnWidths(autoSizeRowData, columns).then((calculatedColumnDefs) => {
            setColumnDefs([...calculatedColumnDefs])
        })
    }

    const setAutoSizeColumnWidthRef = useRef(setAutoSizeColumnWidth)
    const calculateColumnWidths = async (data: TGridRowData, cols: IBasicGridColDef[]) => {
        const calculatedColumnDefs = cols.map((col: IAutoSizeColumnDef, index: number) => {
            const fieldKey = col.field;
            const cellLengths = fieldKey
                ? data.map((row) => String(row[fieldKey] ?? '').length)
                : [0];
            const maxLength = cellLengths.length > 0 ? Math.max(...cellLengths) : 0;
            // const isHidden = cols?.find((c: any) => c.headerName === col.field)?.hide

            const calLeaght =
                col?.headerName != null && col.headerName !== ''
                    ? col.headerName.toString().length * 10 + 20
                    : undefined;
            let width: number | undefined = !col.flex &&
                // Non-empty header name (you mentioned this)
                col.headerName !== '' &&
                // Not hidden (you mentioned this)
                !col.hide ? maxLength * 8 + 15 : (typeof col.width === 'number' ? col.width : undefined);
            width = width && width <= 80 && col.headerName !== '' && calLeaght != null ? calLeaght : width;
            const lastVisibleIndex = getLastVisibleDataColumnIndex(cols);
            if (index === lastVisibleIndex) {
                if (width && width <= 80) {
                    col.minWidth = width;
                }
            }
            return { ...col, width };
        })
        return applyLastVisibleColumnFlex(calculatedColumnDefs);
    };

    const copyRow = (rowNode: RowNode<TGridRow> | null | undefined) => {
        if (!rowNode) {
            return;
        }
        const api = gridProps.gridRef?.current?.api;
        if (!api) return;

        const displayedColumns = api.getAllDisplayedColumns();

        const copiedRow: Record<string, unknown> = {};

        displayedColumns.forEach((column: Column) => {
            // keep your existing logic
            if (!column.isPinned?.() || column.getPinned() !== 'left') {

                const cellValue = api.getCellValue({
                    rowNode,
                    colKey: column.getColId()
                });

                copiedRow[column.getColDef().headerName as string] = cellValue;
            }
        });

        const jsonData = JSON.stringify(copiedRow, null, 2);
        FnCopyToClipboard(jsonData, null, false);
    };

    const copyRowRef = useRef(copyRow);
    //Column resize
    const handleColumnResized = (params: ColumnResizedEvent, props: IBasicGrid) => {
        if (params.finished && params.source == "uiColumnResized") {
            isColumnResizingRef.current = true;
            let userId: string | undefined;
            var user_var = sessionData && sessionData.SessionList ? FnGetSessionVariableFromStorage("RequestedBy", "LoginUserID", sessionData.SessionList) : []
            if (user_var && user_var.length > 0) {
                userId = user_var[0].SessionValue ?? undefined;
            }
            let columns = params.api.getAllGridColumns(); // old version 30.1.0
            // let columns = params.api.getAllGridColumns(); // new vetsion 32.1.0
            const columnJson: IColumnWidthEntry[] = [];
            if (columns && columns.length > 0) {
                columns = columns.filter((column: Column) => {
                    columnJson.push({
                        colname: column.getColId(),
                        colwidth: column.getActualWidth(),
                        headerName: column.getUserProvidedColDef()?.headerName
                            ? column.getUserProvidedColDef()!.headerName!
                            : column.getColId()
                    });
                });
            }
            const gridInstanceName = [
                "import_table",
                "edit_floor_layout",
                "edit_report_layout",
                "edit_layout_column",
                "CablingGrid"
            ]
            if (columnJson && columnJson.length > 0 && !gridInstanceName.includes(gridProps.instanceName)) {
                let value: string | undefined;
                let left: number | undefined;
                let srNoWidth: number | undefined;

                columnJson.forEach((element: IColumnWidthEntry) => {
                    if (element.colname === "Value") {
                        value = element.colwidth + "px";
                    }
                    if (element.colname === "PropertyLabel") {
                        left = element.colwidth;
                    }
                    if (element.headerName === "#") {
                        srNoWidth = element.colwidth;
                    }
                });
                if (value) {
                    const cell = (props.className
                        ? document.querySelector(`.${props.className} .ag-cell-focus`)
                        : document.querySelector(`.ag-cell-focus`)) as HTMLElement | null;

                    const popupEditor = (props.className
                        ? document.querySelector(`.${props.className} .ag-popup-editor`)
                        : document.querySelector(`.ag-popup-editor`)) as HTMLElement | null;
                    if (popupEditor && cell) {
                        popupEditor.style.width = value;
                        popupEditor.style.left = (srNoWidth ? cell.offsetLeft + srNoWidth : cell.offsetLeft) + "px";
                    }
                }

                const json: IDataGridWidthPayload = {
                    UserID: userId,
                    DataGridName: props.instanceName,
                    ColWidthJsonArray: JSON.stringify(columnJson),
                };
                // SAMPLE DATA: API call commented out
                // axiosInterceptor({
                //     url: DATAGRID.SetDatagridJsonColwidtharray,
                //     data: { dataGridJson: JSON.stringify(json) },
                //     setFetchData: () => {
                //         setTimeout(() => {
                //             isColumnResizingRef.current = false;
                //         }, 300);
                //     }
                // }, statusBarContext)
                void json;
                setTimeout(() => {
                    isColumnResizingRef.current = false;
                }, 300);
            }
        }

    }

    // api call for pagination data.
    const makeApiCallForPagination = async (
        payload: IForensicLogPaginationPayload,
        props: IBasicGrid,
        rowDataPre: TGridRowData,
    ) => {
        setIsLoading(true)
        // const handleApiGetFilteredLogResponse = (response: unknown) => {
        //     const logResponse = response as IFilteredLogApiResponse;
        //     if (logResponse?.logJson) {
        //         const logs: unknown = FnParseJsonSafely(logResponse.logJson)
        //         const data = Object.values(logs as Record<string, unknown>)
        //         let TotalRecords = 0
        //         if (data.length > 0 && Array.isArray(data[0]) && data[0].length > 0) {
        //             const Rowdata = data[0] as Array<Record<string, unknown>>
        //             const totalValue = Rowdata[0]?.TotalRecords;
        //             TotalRecords = typeof totalValue === 'number' ? totalValue : 0
        //         }
        //         const resposeData = FnHandleAPIResponse(logResponse.logJson, "Dataset")
        //         if (resposeData && Array.isArray(resposeData)) {
        //             for (let index = 0; index < resposeData.length; index++) {
        //                 const element = resposeData[index] as TGridRow;
        //                 rowDataPre.push(element);
        //             }
        //             setRowData([...rowDataPre])
        //         } else {
        //             setRowData([...rowDataPre])
        //         }
        //     }
        // }
        // SAMPLE DATA: API call commented out
        // axiosInterceptor({
        //     url: LOG.GetFilteredLog,
        //     data: payload,
        //     setFetchData: handleApiGetFilteredLogResponse
        // }, statusBarContext)
        // Keep current rows for sample mode (no live pagination API).
        // void payload;
        // void handleApiGetFilteredLogResponse;
        setIsLoading(false);


    }
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const btn = (e.target as HTMLElement)?.closest(
                'div[data-ref="btLast"]'
            );
            if (!btn) return;
            setJumpToLastPageBtnClicked(true)
        };

        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [])
    const paginationBtnClickAction = useRef<string | null>(null)
    const paginationPageNumber = useRef<number | null>(null)
    // when pagination is changed
    const onPaginationChanged = (
        params: PaginationChangedEvent,
        props: IBasicGrid,
        paginationRowData: TGridRowData,
    ) => {
        const isRecord = (value: unknown): value is Record<string, unknown> =>
            typeof value === 'object' && value !== null && !Array.isArray(value);

        const asPaginationPayload = (
            value: IBasicGrid['apiPayloadForPangination']
        ): IForensicLogPaginationPayload | undefined => {
            if (isRecord(value)) {
                return value;
            }
            return undefined;
        };

        let updateRowData: ReturnType<typeof makeApiCallForPagination> | null = null
        // Node-based forensic log already loads all records — skip pagination API.
        if (String(props.loginType ?? '').toLowerCase() === 'node') {
            if (params?.api) {
                syncPaginationDisplay(props, params.api);
            }
            return null;
        }
        if (params?.api) {
            if (params?.newData) {
                return null;
            }
            const last = params?.api?.paginationGetCurrentPage()
            const total = params?.api?.paginationGetTotalPages()
            syncPaginationDisplay(props, params.api);
            if (jumpToLastPageBtnClicked) {
                const paylaod = asPaginationPayload(props.apiPayloadForPangination)
                if (paylaod) {
                    paylaod.startPage = 1
                    paylaod.recordCount = props?.totalRecords
                    updateRowData = makeApiCallForPagination(paylaod, props, [])
                }

                params.api.paginationGoToLastPage()
                setJumpToLastPageBtnClicked(false)
                return null
            } else {
                if (total === last + 1 && params.newPage && props?.totalRecords) {
                    // Get the current page index (zero-based)
                    const currentPageIndex = params.api.paginationGetCurrentPage();

                    // Get the number of rows displayed per page


                    // Calculate the start and end row indexes of the current page

                    const startPage = currentPageIndex + 1;
                    // const endRow = (startRow + pageSize) + 1;
                    // let pageCount = Number(props?.totalRecords) / pageSize;
                    if (props.instanceName === "nz_forcensic_log" && paginationPageNumber.current !== startPage) {
                        const paylaod = asPaginationPayload(props.apiPayloadForPangination)
                        if (paylaod) {
                            paylaod.startPage = currentPageIndex + 1;
                            // paylaod.recordCount = paginationBtnClickAction.current === "Last" ? props.totalRecords : (pageCount == currentPageIndex) ? props.totalRecords : endRow
                            paylaod.recordCount = gridProps.initRecordCount
                            // if ((count + 1 * orinalVal) <= Number(props.totalRecords)) {
                            updateRowData = makeApiCallForPagination(paylaod, props, paginationRowData)
                            paginationPageNumber.current = startPage
                            // }
                            // params.api.setPageSize(400)
                        }
                    }
                }
            }

        }
        return updateRowData
    }



    function applyToggleDisabledState(items: IOptionItem[]): IOptionItem[] {
        const visibleCount = items.filter((item) => item.value === "1").length;
        return items.map((item) => ({
            ...item,
            disabled: visibleCount === 1 && item.value === "1",
        }));
    }

    function createColumnToggleList(columnDefs: IBasicGridColDef[]): IOptionItem[] {
        const items = columnDefs
            .map((col) => {
                const headerText = col.headerName != null ? String(col.headerName) : '';
                const fieldText = col.field != null && !col.field.includes('id') ? String(col.field) : '';
                const displayName = headerText || fieldText;
                if (!displayName) {
                    return null;
                }
                return {
                    uniqueName: displayName,                 // unique identifier
                    isRenderAsForm: true,                    // render as form
                    label: displayName,                      // label to show
                    value: col.hide ? "0" : "1",            // ON if visible
                    isDefault: false,
                    field: fieldText,                        // default false
                    tooltip: `Show/Hide ${displayName}`,     // tooltip
                    disabled: false                          // enabled
                } as IOptionItem;
            })
            .filter((item): item is IOptionItem => item !== null);
        return applyToggleDisabledState(items);
    }
    useEffect(() => {
        if (columnDefs.length && gridProps.allowColumnFilter) {
            const columnToggleList = createColumnToggleList(columnDefs);
            if (columnToggleList)
                setColumnToggleList([...columnToggleList])
        }
    }, [columnDefs, gridProps.allowColumnFilter])

    function handleFilterSelect(value: IOptionItem, updateData?: IOptionItem[]): void {

        if (value) {
            if (!gridRef?.current?.api && !gridProps?.gridRef?.current?.api) return;

            const api =
                gridRef?.current?.api ||
                gridProps.gridRef?.current?.api;
            if (!api) {
                return;
            }

            if (updateData) {
                const visibleAfter = updateData.filter((item) => item.value === "1").length;
                if (visibleAfter === 0) {
                    return;
                }
            }

            //  must be FIELD / colId
            const colId = value.field;

            // Check column exists
            const column = api.getColumn(colId);
            if (!column) {
                console.warn(`Column not found: ${colId}`);
                return;
            }
            //  SHOW if value === "1", HIDE if value === "0"
            const isVisible = value.value !== "1" ? true : false;

            api.applyColumnState({
                state: [
                    {
                        colId,
                        hide: isVisible // "0" => hide, "1" => show
                    }
                ],
                applyOrder: false
            });
            let colDef: IBasicGridColDef[] = []
            columnDefs.forEach((col: IBasicGridColDef) => {
                if (col.field === colId) {
                    col.hide = isVisible;
                }
                colDef.push(col)
            })
            const flexAppliedColDef = applyLastVisibleColumnFlex(colDef);
            const flexState = flexAppliedColDef
                .filter((col) => !isUtilityColumn(col))
                .map((col) => ({
                    colId: (col.field ?? col.colId) as string,
                    flex: col.flex ?? null,
                }))
                .filter((state) => state.colId);
            if (flexState.length > 0) {
                api.applyColumnState({
                    state: flexState,
                    applyOrder: false,
                });
            }
            updateData && setColumnToggleList(applyToggleDisabledState(updateData))
            setColumnDefs([...flexAppliedColDef])
            let userId: string | undefined;
            var user_var = FnGetSessionVariableFromStorage("RequestedBy", "LoginUserID", sessionData.SessionList);
            if (user_var && user_var.length > 0) {
                userId = user_var[0].SessionValue ?? undefined;
            }
            const columnsForSave = [...columnDefs]; // old version 30.1.0
            // let columns = params.api.getAllGridColumns(); // new vetsion 32.1.0
            const columnJson: IColumnWidthEntry[] = [];
            if (columnsForSave && columnsForSave.length > 0) {
                columnsForSave.filter((column: IExtendedBasicGridColDef) => {
                    columnJson.push({
                        colname: column.headerName ?? '',
                        colwidth: column.actualWidth ?? 0,
                        headerName: column.userProvidedColDef?.headerName
                            ? column.userProvidedColDef.headerName
                            : (column.colId ?? ''),
                        isHidden: false,
                    });
                });
            }
            const gridInstanceName = [
                "import_table",
                "edit_floor_layout",
                "edit_report_layout",
                "edit_layout_column",
                "CablingGrid"
            ]
            if (columnJson && columnJson.length > 0 && !gridInstanceName.includes(gridProps.instanceName)) {
                let value;
                let left;
                let srNoWidth;

                columnJson.forEach((element: IColumnWidthEntry) => {
                    const col = updateData && updateData?.find((c: IOptionItem) => c.uniqueName === element.colname)?.value

                    const isHidden = col === "0" ? true : false

                    if (element.colname === "Value") {
                        value = element.colwidth + "px";
                    }
                    if (element.colname === "PropertyLabel") {
                        left = element.colwidth;
                    }
                    if (element.headerName === "#") {
                        srNoWidth = element.colwidth;
                    }
                    element.isHidden = isHidden



                });

                if (value) {
                    const cell = (gridProps.className
                        ? document.querySelector(`.${gridProps.className} .ag-cell-focus`)
                        : document.querySelector(`.ag-cell-focus`)) as HTMLElement | null;

                    const popupEditor = (gridProps.className
                        ? document.querySelector(`.${gridProps.className} .ag-popup-editor`)
                        : document.querySelector(`.ag-popup-editor`)) as HTMLElement | null;
                    if (popupEditor && cell) {
                        popupEditor.style.width = value;
                        popupEditor.style.left = (srNoWidth ? cell.offsetLeft + srNoWidth : cell.offsetLeft) + "px";
                    }
                }

                let json = {
                    UserID: userId,
                    DataGridName: gridProps.instanceName,
                    ColWidthJsonArray: JSON.stringify(columnJson),
                };
                // SAMPLE DATA: API call commented out
                // axiosInterceptor({
                //     url: DATAGRID.SetDatagridJsonColwidtharray,
                //     data: { dataGridJson: JSON.stringify(json) },
                //     setFetchData: () => {
                //         setTimeout(() => {
                //             isColumnResizingRef.current = false;
                //         }, 300);
                //     }
                // }, statusBarContext)
                void json;
                setTimeout(() => {
                    isColumnResizingRef.current = false;
                }, 300);
            }


        }
    }

    return (
        <>
            {gridProps?.showGrid && <div
                style={ContainerStyle}
                className={"nz-grid-container-div "}
                id="gc-app-para"
                key={gridProps.uniqueName + gridProps.id}
                data-key={gridProps.uniqueName + gridProps.id}
            >
                {columnDefs && columnDefs.length > 0 && rowData && rowData?.length > 0 && (
                    <>
                        {gridProps.tableLabel && gridProps.showPropertyHeader && <div className="nz-sub-header">
                            <div className="nz-form-title-header">
                                <div className="nz-qa-bar-container-entiyGrid nz-sub-header-propPane">
                                    <span className="nz-property-bar-title-span">
                                        {gridProps.tableLabel ? gridProps.tableLabel : gridProps.tableName}
                                    </span>
                                </div>
                            </div>
                        </div>}
                        {!gridProps.hideCopyIcon && rowData && rowData?.length > 0 && (
                            <div className={`nz-copy-to-clipboard-div ${gridProps.showPropertyHeader ? 'nz-showPropertyHeader-with-download' : ''}`}>
                                <div className={`nz-copy-download-icon-container ${gridProps.allowColumnFilter && columnToggleList.length > 4 ? "nz-show-column-filter" : ""}`}>
                                    <IconButton
                                        className={
                                            indexColumnAdded || gridProps?.isReadOnly
                                                ? "nz-copy-to-clipboard-only"
                                                : "nz-copy-to-clipboard-josn-grid"
                                        }
                                        size="small"
                                        title={gridProps.isExportOnCopy ? "Download Data" : "Copy Data"}
                                        onClick={() => gridProps.handleDownloadData ? gridProps.handleDownloadData() : copyDisplayedColumnsData(gridProps, gridRef ? gridRef : gridProps.gridRef)}

                                    >
                                        {gridProps.isExportOnCopy ?
                                            <Image uniqueName="download" source={<Download24x24
                                                size={FnGetCssVariable('--image-size-1')}
                                                fill='none'
                                                strokeWidth={1} />} type="svg" w="var(--image-size-1)" h="var(--image-size-1)" /> :
                                            <Image uniqueName="copy" source={<Copy24x24
                                                size={FnGetCssVariable('--image-size-1')}
                                                fill='none'
                                                strokeWidth={1} />} type="svg" w="var(--image-size-1)" h="var(--image-size-1)" />
                                        }
                                    </IconButton>

                                    {columnToggleList && gridProps.allowColumnFilter && columnToggleList.length > 4 && <OptionsFilter showIcon={true}
                                        uniqueName={'app-qa-filter'} container={'ap-filter'}
                                        handleSelect={handleFilterSelect}
                                        allowMultiSelect={true}
                                        allowHeader={true}
                                        showSelectColumnIcon={true}
                                        options={columnToggleList}
                                    />}
                                </div>

                            </div>
                        )}

                        <div
                            style={gridParentStyle}
                            className="ag-theme-alpine nz-ag-container"
                            id={gridProps.id ? gridProps.id : `ag-grid-${gridProps.uniqueName}`}
                        >
                            <AgGridReact
                                className={gridProps.className}
                                ref={gridProps.gridRef ? gridProps.gridRef : gridRef}
                                rowHeight={Number(NodeHeight.replace("px", ""))}
                                onGridReady={(params: GridReadyEvent) => {
                                    const paginationPanel = document.querySelector('.ag-paging-panel');

                                    if (paginationPanel) {
                                        paginationPanel.addEventListener('click', (e) => {
                                            const target = e.target as HTMLElement;

                                            if (target.classList.contains('ag-icon-next')) {
                                                paginationBtnClickAction.current = 'Next';
                                            }
                                            if (target.classList.contains('ag-icon-previous')) {
                                                paginationBtnClickAction.current = 'Previous';
                                            }
                                            if (target.classList.contains('ag-icon-first')) {
                                                paginationBtnClickAction.current = 'First';
                                            }
                                            if (target.classList.contains('ag-icon-last')) {
                                                paginationBtnClickAction.current = 'Last';
                                            }
                                        });
                                    }
                                    onGridReady(params, gridProps)
                                    syncPaginationDisplay(gridProps, params.api);
                                    if (gridProps.handleGridReady) {
                                        gridProps.handleGridReady(params);
                                    }
                                }}

                                pagination={gridProps.allowPagination || false}
                                columnDefs={columnDefs}
                                rowData={rowData}
                                defaultColDef={defaultColDef}
                                rowClassRules={gridProps.rowClassRules || undefined}
                                suppressPaginationPanel={false}

                                onCellFocused={() => {
                                    if (gridProps?.instanceName === "user_auth_edit_mode") {
                                        const div = document.querySelector(
                                            ".nz-user-auth-right-side .nz-property-main-header .nz-save-yellow-background"
                                        );

                                        if (div) {
                                            div.classList.add("nz-hide-button");
                                        }
                                    }
                                }}
                                onCellValueChanged={(params: CellValueChangedEvent) => {

                                    if (params.source === "edit") {
                                        if (gridProps?.instanceName === "user_auth_edit_mode") {
                                            const div = document.querySelector(
                                                ".nz-user-auth-right-side .nz-property-main-header .nz-save-yellow-background"
                                            );

                                            if (div) {
                                                div.classList.remove("nz-hide-button");
                                            }
                                        }

                                    }

                                }}

                                paginationPageSize={
                                    gridProps.paginationPageSize || GridDefaults.paginationPageSize
                                }
                                tooltipShowDelay={0}
                                tooltipHideDelay={2000}
                                suppressFieldDotNotation={true}
                                suppressAutoSize={false}
                                gridOptions={
                                    gridProps?.gridOptions || gridOptions
                                }
                                singleClickEdit={true}
                                enableCellTextSelection={true}
                                ensureDomOrder={true}
                                onRowDataUpdated={(event) => {
                                    if (gridProps.checkboxSelection) {
                                        event.api.forEachNode((node) => {
                                            const nodeData = node.data as IGridRowWithSelection | undefined;
                                            if (nodeData?.selected || nodeData?.Selected) {
                                                node.setSelected(true);
                                            }
                                        });
                                    }
                                    const pageSize = event.api.paginationGetPageSize();
                                    if (paginationBtnClickAction.current === "Last" && gridProps?.totalRecords) {
                                        const pageCount = Math.ceil(Number(gridProps.totalRecords) / pageSize);
                                        event?.api?.paginationGoToPage(Math.max(0, pageCount - 1))
                                        paginationBtnClickAction.current = ''
                                    }
                                    hideShowPaginatation(gridProps);
                                    syncPaginationDisplay(gridProps, event.api);
                                    setIsLoading(false);
                                    if (gridProps.onRowDataUpdated) {
                                        gridProps.onRowDataUpdated(event);
                                    }
                                }}

                                onColumnResized={(params: ColumnResizedEvent) => handleColumnResized(params, gridProps)}
                                paginationAutoPageSize={
                                    gridProps.paginationAutoPageSize || false
                                }
                                rowSelection={gridProps.rowSelection || 'single'}
                                onCellClicked={(event: CellClickedEvent) => {
                                    if (event.column.getColId() !== "checkbox-column") {
                                        event.node.setSelected(event.node.isSelected() as boolean);
                                    }
                                    handleMouseEvent(event, gridRef, gridProps)
                                }}
                                enableBrowserTooltips={true}
                                skipHeaderOnAutoSize={true}
                                onSelectionChanged={(event: SelectionChangedEvent) => {
                                    if (gridProps.instanceName === "audit_reconciliation") {
                                        const selectedNodes = event.api.getSelectedNodes();
                                        if (selectedNodes) {
                                            event.api.redrawRows({ rowNodes: selectedNodes });
                                        }
                                    }
                                }}
                                onRowClicked={(event: RowClickedEvent) => {
                                    event.node.setSelected(event.node.isSelected() as boolean, false);
                                    handleMouseEvent(event, gridRef, gridProps)
                                }}
                                suppressRowClickSelection={true}
                                onPaginationChanged={(event: PaginationChangedEvent) => {
                                    onPaginationChanged(event, gridProps, rowData)?.then((row: unknown) => {
                                        if (Array.isArray(row)) {
                                            setRowData([...(row as TGridRowData)])

                                        }

                                    })
                                }}
                                onFirstDataRendered={(params) => {
                                    if (gridProps.onFirstDataRendered) {
                                        gridProps.onFirstDataRendered(params);
                                    }


                                }}
                                rowBuffer={GridDefaults.rowBuffer}
                                onCellMouseDown={(event: CellMouseDownEvent) => {
                                    if (event.column.getColId() !== "checkbox-column") {
                                        event.node.setSelected(event.node.isSelected() as boolean);
                                    }
                                    handleMouseEvent(event, gridRef, gridProps)
                                }}
                                suppressHorizontalScroll={false}
                                suppressRowVirtualisation={true}
                                domLayout="normal"
                                context={{ rowData: rowData, Cabling: gridProps.cablingTabelData, diagnosticLevel: gridProps.diagnosticLevel, tableName: gridProps.tableName }}
                                loading={isLoading}
                                suppressMaxRenderedRowRestriction={true}
                                theme="legacy"
                                overlayNoRowsTemplate={`<span class="nz-noData-in-grid-${gridProps.className}">No Rows To Show</span>`}
                            ></AgGridReact>
                        </div>
                    </>
                )
                }
            </div >}


        </>
    )
}

export { BasicGrid }