
import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";
import { EditableCallbackParams, ICellRendererParams } from 'ag-grid-community';
import './ForensicLog.css'
import { FnCellEditorSelector } from '../../../../shared/allcommon/tablegrid/FnCellEditorSelector';
import { FnGetSessionVariableFromStorage } from '../../../../shared/allcommon/basic/FnGetSessionVariableFromStorage';
import {
    IBasicGridColDef,
    IColumnWidthEntry,
    IForensicLogPaginationPayload,
    IFilteredLogApiResponse,
    TGridRow,
    TGridRowData,
} from '../../../../shared/allinterface/tablegrid/IBasicGrid';
import { IForensicLog, IForensicLogColumn, IForensicLogPayload, IForensicLogTableData } from '../../../allinterface/profile/IForensicLog';
import { FnGetSessionStorageItem } from '../../../../shared/allcommon/basic/FnGetSessionStorageItem';
import { FnHandleAPIResponse } from '../../../../shared/allcommon/basic/FnHandleAPIResponse';
import { useSessionContext } from '../../../../shared/context/hooks/SessionHooks';
import { useStatusBarContext } from '../../../../shared/context/hooks/StatusBarHooks';
import { handleNestedZoneContainerKeyDown } from '../../../../shared/allcommon/basic/FnHandleContainerKeyDown';
import LogData from '../../../../../serviceSampledata/sidebar/GetForensicLog.json';

const sampleForensicLogApiResponse = {
    logJson: JSON.stringify(LogData),
};
import { FnGetColumnWidthFromSession } from '../../../../shared/allcommon/tablegrid/FnGetColumnWidthFromSession';
import { FORENSIC_LOG_EM_TABLE, FnGetDataGridColumnHide, getExcludeDataGridFieldValue } from '../../../../shared/allcommon/tablegrid/FnGetDataGridColumnHide';
import { useMainAppContext } from '../../../../shared/context/hooks/MainAppHooks';
import { AgGridReact } from 'ag-grid-react';
import { FnConvertDateToUtcOrUtcToDate } from '../../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';
import { FnGetAppDateFormat } from '../../../../shared/allcommon/basic/FnGetAppDateFormat';
import { ISession } from '../../../../shared/context/allinterface/ISession';
import { BasicGrid } from '../../../../shared/tablegrid/BasicGrid';

const padDatePart = (value: number) => value.toString().padStart(2, '0');

/*Format local datetime for forensic log API (e.g. 2026-07-02 13:45:30). */
const formatForensicLogDateTime = (dateValue: Date): string => {
    const year = dateValue.getFullYear();
    const month = padDatePart(dateValue.getMonth() + 1);
    const day = padDatePart(dateValue.getDate());
    const hours = padDatePart(dateValue.getHours());
    const minutes = padDatePart(dateValue.getMinutes());
    const seconds = padDatePart(dateValue.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


/*Initial API payload: last 24 hours with time (e.g. 2026-07-01 13:45:30). */
const getInitialPayloadStartDate = (): string => {
    const start = new Date();
    start.setTime(start.getTime() - 24 * 60 * 60 * 1000);
    return formatForensicLogDateTime(start);
};

const getInitialPayloadEndDate = (): string => formatForensicLogDateTime(new Date());

/*Narrow unknown API / form values to a plain object. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);


const isForensicLogColumn = (value: unknown): value is IForensicLogColumn =>
    isRecord(value) &&
    typeof value.PropertyLabel === 'string' &&
    typeof value.PName === 'string';

const toForensicLogColumnArray = (value: unknown): IForensicLogColumn[] | null => {
    if (!Array.isArray(value)) {
        return null;
    }
    const columns = value.filter(isForensicLogColumn);
    return columns.length > 0 ? columns : null;
};

const toGridRowData = (value: unknown): TGridRowData | null =>
    Array.isArray(value) ? value as TGridRowData : null;

const isColumnWidthEntryArray = (value: unknown): value is IColumnWidthEntry[] =>
    Array.isArray(value) &&
    value.every(
        (entry) =>
            isRecord(entry) &&
            typeof entry.colname === 'string' &&
            typeof entry.colwidth === 'number'
    );

const getDisplayControlFromColDef = (colDef: EditableCallbackParams['colDef']): string | undefined => {
    if (!colDef || !('DisplayControl' in colDef)) {
        return undefined;
    }
    const displayControl = colDef.DisplayControl;
    return typeof displayControl === 'string' ? displayControl : undefined;
};



const buildForensicLogFilterPayload = (filters: Record<string, unknown>, removeUserName?: boolean): Record<string, unknown> => {

    const payload: Record<string, unknown> = { ...filters };

    return payload;
};

const ForensicLog = (props: IForensicLog) => {
    const [columnDefs, setColumnDefs] = useState<IBasicGridColDef[]>([]);
    const [rowData, setRowData] = useState<TGridRowData | null | undefined>()
    const [forensicLogTableData, setForensicLogTableData] = useState<IForensicLogTableData | null>(null);
    const [totalRecords, setTotalRecords] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [initRecordCount, setInitRecordCout] = useState<number>(0)
    const sessionData = useSessionContext()
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const gridRef = useRef<AgGridReact>(null);
    const initialApiLoadedRef = useRef(false);
    const selectedNodeReloadKeyRef = useRef<string>('');
    const emRecordsRef = useRef(mainAppContext.emRecords);
    const forensicColumnBuildKeyRef = useRef<string | null>(null);
    const completedForensicColumnBuildKeyRef = useRef<string | null>(null);

    emRecordsRef.current = mainAppContext.emRecords;
    const emRecordsLoaded = mainAppContext.emRecords.length > 0;

    useEffect(() => {
        if (forensicLogTableData === null) {
            forensicColumnBuildKeyRef.current = null;
            completedForensicColumnBuildKeyRef.current = null;
            setRowData(null);
            return;
        }

        const buildKey = JSON.stringify({
            columnPNames: forensicLogTableData.ColumnList?.map((column) => column.PName) ?? [],
            dataset: forensicLogTableData.Dataset,
            emRecordsLoaded,
        });

        if (completedForensicColumnBuildKeyRef.current === buildKey) {
            return;
        }
        forensicColumnBuildKeyRef.current = buildKey;

        let cancelled = false;

        const FnSetColumnDefsWidth = async () => {
            try {
                // SAMPLE DATA: skip DATAGRID.GetDatagridJsonColwidtharray — it blocks the grid when the API is unavailable.
                // const columnsSettingsRaw = await FnGetColumnWidthFromSession('nz_forcensic_log', "", statusBarContext);
                const columnsSettingsRaw = null;
                void FnGetColumnWidthFromSession;
                void statusBarContext;
                if (cancelled) {
                    return;
                }

                const columnsSettings: any = isColumnWidthEntryArray(columnsSettingsRaw) ? columnsSettingsRaw : null;
                const resposeData = forensicLogTableData.Dataset;
                const columnListData = forensicLogTableData.ColumnList;
                if (!columnListData) {
                    return;
                }

                const colDefs: IBasicGridColDef[] = [];
                for (let index = 0; index < columnListData.length; index++) {
                    const column = columnListData[index];
                    const width = columnsSettings?.find((c: IColumnWidthEntry) => c.colname === column.PName)?.colwidth;
                    const columnSession = columnsSettings?.find((c: IColumnWidthEntry) => c.colname === column.PropertyLabel);
                    const isHidden = columnSession?.isHidden;
                    const excludeDataGridField = getExcludeDataGridFieldValue(
                        column.ExcludeDataGridField,
                        emRecordsRef.current,
                        FORENSIC_LOG_EM_TABLE,
                        column.PName
                    );

                    const colDef: IBasicGridColDef = {
                        headerName: column.PropertyLabel,
                        field: column.PName,
                        width: width ?? 150,
                        DisplayControl: column.DisplayControl,
                        resizable: true,
                        hide: FnGetDataGridColumnHide(isHidden, excludeDataGridField),
                        editable: (params: EditableCallbackParams) => {
                            const displayControl = getDisplayControlFromColDef(params.colDef);
                            return !!displayControl && displayControl !== "TextControl" &&
                                !displayControl.toLowerCase().includes("apform_");
                        },
                        cellEditorSelector: (params) => {
                            return FnCellEditorSelector(params);
                        },
                        cellRenderer: (params: ICellRendererParams) => {
                            return <span>{params.value}</span>;
                        }
                    };

                    if (index === columnListData.length - 1) {
                        colDef.flex = 1;
                        colDef.width = undefined;
                        colDef.minWidth = 100;
                        colDef.resizable = false;
                    }
                    if (column.PropertyLabel !== "") {
                        if (column.PName?.toLowerCase() === "lastupdated") {
                            colDef.cellRenderer = (params: ICellRendererParams) => {
                                return <span>{params.value ? FnConvertDateToUtcOrUtcToDate(params.value, false, true) : ""}</span>;
                            };
                        }
                        colDefs.push(colDef);
                    }
                }

                if (cancelled) {
                    return;
                }

                completedForensicColumnBuildKeyRef.current = buildKey;
                setColumnDefs(colDefs);
                if (resposeData && resposeData.length > 0) {
                    setRowData(resposeData);
                } else {
                    setRowData([]);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }
                console.error('ForensicLog: failed to build column definitions', error);
                setColumnDefs([]);
                setRowData([]);
            }
        };

        FnSetColumnDefsWidth();

        return () => {
            cancelled = true;
        };
    }, [forensicLogTableData, emRecordsLoaded])


    useEffect(() => {

        const selectedNodeReloadKey =
            String(props.selectedNode?.NodeEntID ?? '');

        if (selectedNodeReloadKey !== selectedNodeReloadKeyRef.current) {
            selectedNodeReloadKeyRef.current = selectedNodeReloadKey;
            initialApiLoadedRef.current = false;
            setLoading(true);
        }

        if (initialApiLoadedRef.current) {
            return;
        }


        const init = async () => {
            const defaultStartDate = getInitialPayloadStartDate();
            const defaultEndDate = getInitialPayloadEndDate();
            const isNodeFilter = String(props.loginType ?? '').toLowerCase() === 'node';
            const userDetails: ISession[] | null = FnGetSessionVariableFromStorage("RequestedBy", 'LoginShortName', sessionData.SessionList)
            // SAMPLE DATA: load forensic log once session user is available.
            if (userDetails && userDetails.length > 0) {
                initialApiLoadedRef.current = true;
                apiCallForGridData({
                    sessionId: FnGetSessionStorageItem("user_session") ?? "",
                    filterJsonString: JSON.stringify({
                        Users: userDetails[0].SessionValue ?? "",
                        ANDOR: "and",
                        Keywords: "",
                        FilterBy: props.loginType,
                        StartDate: isNodeFilter ? '' : defaultStartDate,
                        EndDate: isNodeFilter ? '' : defaultEndDate,
                    }),
                    startPage: 1,
                    recordCount: isNodeFilter ? 100 : 10
                })
            }

        }
        init()
    }, [sessionData.SessionList, props.selectedNode])


    const apiCallForGridData = async (
        payload: IForensicLogPayload & IForensicLogPaginationPayload,
        isdownload?: boolean
    ) => {
        if (payload?.filterJsonString) {
            try {
                const parsedFilters: unknown = JSON.parse(payload.filterJsonString);
                if (isRecord(parsedFilters)) {
                    payload.filterJsonString = JSON.stringify(buildForensicLogFilterPayload(parsedFilters, true));
                }
            } catch (error) {
                // Keep original filterJsonString when profile JSON is invalid.
                console.error('ForensicLog: invalid filterJsonString', error);
            }
        }
        let div: HTMLDivElement | null = document.querySelector('.nz-sidebar-container') ? document.querySelector('.nz-sidebar-container') : document.querySelector('.nz-main-search-control-log')

        const isNodeFilter = String(props.loginType ?? '').toLowerCase() === 'node';
        if (isNodeFilter && !isdownload) {
            // FilterBy "Node": request up to 100 records.
            payload.recordCount = 100;
            setInitRecordCout(100);
        } else if (div && !isdownload) {
            let endRec = Math.round(Number(div.offsetHeight - 92) / 24)
            payload.recordCount = endRec + 2
            setInitRecordCout(endRec + 2)
        }
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();
        const handleApiGetFilteredLogResponse = async (response: IFilteredLogApiResponse) => {
            if (!response?.logJson) {
                return;
            }

            try {
                let TotalRecords = 0;
                try {
                    const logs = JSON.parse(response.logJson) as Record<string, unknown>;
                    const data: unknown[] = Object.values(logs);
                    if (data.length > 0) {
                        const rowdata = data[0];
                        if (Array.isArray(rowdata) && rowdata.length > 0) {
                            const firstRow = rowdata[0];
                            if (isRecord(firstRow) && firstRow.TotalRecords != null) {
                                TotalRecords = Number(firstRow.TotalRecords) || 0;
                            }
                        }
                    }
                } catch (error) {
                    console.error('ForensicLog: failed to parse TotalRecords from logJson', error);
                }

                const resposeData = toGridRowData(FnHandleAPIResponse(response.logJson, "Dataset"));
                const columnListData = toForensicLogColumnArray(FnHandleAPIResponse(response.logJson, "ColumnList"));

                // FilterBy "Node": pagination total = returned record length (100 if 100, else actual length).
                if (isNodeFilter && !isdownload) {
                    const apiRecordLength = resposeData?.length ?? 0;
                    TotalRecords = apiRecordLength === 100 ? 100 : apiRecordLength;
                    payload.recordCount = TotalRecords;
                    setInitRecordCout(TotalRecords);
                }

                if (!isdownload) {
                    setForensicLogTableData({ Dataset: resposeData, ColumnList: columnListData, apiParams: payload });
                } else {
                    try {
                        const headers: string[] = [];
                        let sortedColumnKeys: string[] = [];

                        columnListData?.forEach((item: IForensicLogColumn) => {
                            headers.push(item.PropertyLabel);
                            sortedColumnKeys.push(item.PName)
                        });

                        const rows: (string | number)[][] = [];
                        if (headers.length > 0) {
                            rows.push(headers);
                        }

                        resposeData?.forEach((dataRow: TGridRow) => {
                            const orderedRow = sortedColumnKeys.map((key) => {
                                const cellValue = dataRow[key];
                                if (cellValue == null) {
                                    return '';
                                }
                                if (typeof cellValue === 'string' || typeof cellValue === 'number') {
                                    return cellValue;
                                }
                                return String(cellValue);
                            });
                            rows.push(orderedRow);
                        });

                        const worksheet = XLSX.utils.aoa_to_sheet(rows);
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'forensiclog');

                        // Export workbook
                        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([wbout], {
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        });
                        saveAs(blob, `forensiclog.xlsx`);
                    } catch (error) {
                        console.error('ForensicLog: failed to export forensic log', error);
                        props.handleShowUserMessage?.('Unable to export forensic log. Please try again.');
                    }
                }
                setTotalRecords(TotalRecords);
                setLoading(false);
            } catch (error) {
                console.error('ForensicLog: failed to process filtered log response', error);
                setRowData([]);
                setLoading(false);
            }
        }
        // SAMPLE DATA: LOG.GetFilteredLog API commented out.
        // axiosInterceptor({
        //     url: LOG.GetFilteredLog,
        //     data: payload,
        //     allowShowLoader: true,
        //     setFetchData: handleApiGetFilteredLogResponse
        // }, statusBarContext);
        void handleApiGetFilteredLogResponse(
            sampleForensicLogApiResponse as IFilteredLogApiResponse
        );
    }

    const handleDownloadData = async () => {
        const userDetails: ISession[] | null = FnGetSessionVariableFromStorage("RequestedBy", 'LoginShortName', sessionData.SessionList)
        if (userDetails && userDetails.length > 0) {
            apiCallForGridData({
                filterJsonString: JSON.stringify({
                    Users: userDetails[0].SessionValue,
                    ANDOR: "and",
                    Keywords: "",
                    FilterBy: props.loginType,
                }),
                startPage: 1,
                recordCount: totalRecords,
            },
                true
            )
        }
    }


    useEffect(() => {
        const sidebarContainer: HTMLElement | null = document.querySelector('.nz-qa-sidebar-container');
        if (sidebarContainer) {
            // Select all AG Grids inside the sidebar only
            const gridPanelsInSidebar = sidebarContainer.querySelectorAll('.nz-qa-sidebar-container .ag-paging-panel');

            gridPanelsInSidebar.forEach((panel) => {
                const recordCount = panel.querySelector('.custom-record-count') as HTMLElement;
                const summaryPanel = panel.querySelector('.ag-paging-row-summary-panel') as HTMLElement;

                const width = panel.getBoundingClientRect().width;

                if (recordCount) {
                    recordCount.style.display = width < 475 ? 'none' : 'inline-block';
                }
                if (summaryPanel) {
                    summaryPanel.style.display = width < 375 ? 'none' : 'inline-block';
                }
            });
        }
    }, [rowData])

    return (
        <div className='nz-forensic-log-root' tabIndex={1} onKeyDown={handleNestedZoneContainerKeyDown}>
            <div className='nz-main-search-control-log'>
                <div className="nz-logs-grid">

                    {loading ? (
                        <div className="nz-forensic-log-loading nz-forensic-log-no-data-to-show">Loading...</div>
                    ) : rowData && rowData.length > 0 ? (
                        <BasicGrid
                            gridRef={gridRef}
                            showGrid={true}
                            uniqueName={"nz_forcensic_log"}
                            allowAutoSizeColumn={false}
                            containerName={props.isSetting ? "nz_forcensic_log" : "nz_f_log_setting"}
                            instanceName="nz_forcensic_log"
                            featureId={props.featureId}
                            allowColumnResize={true}
                            isExportOnCopy={true}
                            rowData={rowData}
                            isReadOnly={true}
                            allowColumnFilter={true}
                            columnDefs={columnDefs}
                            allowPagination={true}
                            dynamicPagination={true}
                            paginationAutoPageSize={true}
                            allowSort={props.allowSort}
                            totalRecords={totalRecords}
                            // Pass mutable API payload for dynamic pagination; undefined until first successful load.
                            apiPayloadForPangination={forensicLogTableData?.apiParams ? forensicLogTableData.apiParams : undefined}
                            featureData={undefined}
                            initRecordCount={initRecordCount}
                            loginType={props.loginType}
                            handleDownloadData={handleDownloadData}
                        />
                    ) : (
                        // case 3: no data
                        rowData && rowData.length === 0 && (
                            <div className="nz-forensic-log-no-data-to-show">Forensic log details not found.</div>
                        )
                    )}
                </div>
            </div>
        </div>

    )
}



export { ForensicLog }
