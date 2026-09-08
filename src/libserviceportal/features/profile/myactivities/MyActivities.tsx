
import { useCallback, useEffect, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { AgGridReact } from 'ag-grid-react'
import type { ICellRendererParams } from 'ag-grid-community'
import { useActivities } from '@n20a/libfsdb'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { BasicGrid } from '../../../shared/tablegrid/BasicGrid'
import type { IBasicGridColDef } from '../../../shared/allinterface/tablegrid/IBasicGrid'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks'
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate'
import './MyActivities.css'

interface IMyActivities {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;// feature id
    headerText?: string;// header text coming from the selected menu item
    allowSort?: boolean;// allow grid column sort, defaults to true
    handleShowUserMessage?: (messageText: string) => void;
}

function formatActivityDate(value: unknown): string {
    if (value == null || value === '') {
        return '';
    }
    if (typeof value === 'string') {
        return FnConvertDateToUtcOrUtcToDate(value, false, true) || value;
    }
    if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate().toLocaleString();
    }
    if (typeof value === 'object' && 'seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
        return new Date((value as { seconds: number }).seconds * 1000).toLocaleString();
    }
    return String(value);
}

function parseActivityDate(value: unknown, row?: Record<string, unknown>): number {
    if (value != null && value !== '') {
        if (typeof value === 'number') {
            return value;
        }
        if (value instanceof Date) {
            return value.getTime();
        }
        if (typeof value === 'object') {
            if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
                return (value as { toDate: () => Date }).toDate().getTime();
            }
            if ('seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
                return (value as { seconds: number }).seconds * 1000;
            }
        }
        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
    }
    // Fallback: extract timestamp if activityid ends with numeric timestamp (e.g. activity_cid_1788857795000)
    if (row && typeof row.activityid === 'string') {
        const match = row.activityid.match(/_(\d{10,13})$/);
        if (match) {
            const ts = Number(match[1]);
            if (!isNaN(ts)) {
                return ts;
            }
        }
    }
    return 0;
}

const MyActivities = (myActivitiesProps: IMyActivities) => {
    const headerTitle = myActivitiesProps.headerText ?? "My Activities";
    const mainAppContext = useMainAppContext();
    const userInfo = mainAppContext.userInfoAndSubscription?.userInfo;
    const bid = String(userInfo?.bid ?? '').trim();
    const cid = String(userInfo?.cid ?? '').trim();
    const { activities, loading, error, getActivities } = useActivities(bid);
    const gridRef = useRef<AgGridReact>(null);

    useEffect(() => {
        if (!bid) {
            return;
        }
        const filters = cid
            ? [{ field: 'cid', op: '==' as const, value: cid }]
            : undefined;
        void getActivities(filters);
    }, [bid, cid, getActivities]);

    const columnDefs = useMemo<IBasicGridColDef[]>(() => [
        {
            headerName: 'Date Created',
            field: 'datecreated',
            width: 180,
            resizable: true,
            sortable: myActivitiesProps.allowSort ?? true,
            sort: 'desc',
            comparator: (valueA: unknown, valueB: unknown, nodeA, nodeB) => {
                const timeA = parseActivityDate(valueA, nodeA?.data as Record<string, unknown> | undefined);
                const timeB = parseActivityDate(valueB, nodeB?.data as Record<string, unknown> | undefined);
                return timeA - timeB;
            },
            cellRenderer: (params: ICellRendererParams) => (
                <span>{formatActivityDate(params.value)}</span>
            ),
        },
        {
            headerName: 'Message',
            field: 'message',
            flex: 1,
            minWidth: 220,
            resizable: true,
            sortable: myActivitiesProps.allowSort ?? true,
        },
    ], [myActivitiesProps.allowSort]);

    const rowData = useMemo(() => {
        if (!activities?.length) return [];
        return [...activities].sort((a, b) => {
            const timeA = parseActivityDate(a?.datecreated, a as Record<string, unknown>);
            const timeB = parseActivityDate(b?.datecreated, b as Record<string, unknown>);
            return timeB - timeA; // Descending: newest record on top
        });
    }, [activities]);

    const handleDownloadExcel = useCallback(() => {
        const api = gridRef.current?.api;
        const rows: (string | number)[][] = [
            ['Date Created', 'Message']
        ];

        if (api) {
            api.forEachNodeAfterFilterAndSort((node) => {
                if (node.group) return;
                const dateVal = formatActivityDate(node.data?.datecreated);
                const msgVal = node.data?.message != null ? String(node.data.message) : '';
                rows.push([dateVal, msgVal]);
            });
        } else if (rowData.length > 0) {
            rowData.forEach((row) => {
                const dateVal = formatActivityDate(row.datecreated);
                const msgVal = row.message != null ? String(row.message) : '';
                rows.push([dateVal, msgVal]);
            });
        }

        if (rows.length <= 1) {
            return;
        }

        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'MyActivities');

            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, 'myactivities.xlsx');
        } catch (error) {
            console.error('MyActivities: failed to export Excel', error);
            myActivitiesProps.handleShowUserMessage?.('Unable to export activities. Please try again.');
        }
    }, [rowData, myActivitiesProps]);

    const showGrid = !loading && !error && rowData.length > 0;

    return (
        <div key={myActivitiesProps.uniqueName} className='nz-my-activities-container nz-wh-100'>
            <div className='nz-sub-header'>
                <Label
                    uniqueName={`${myActivitiesProps.uniqueName}-header`}
                    label={headerTitle}
                    fontWeight='600' />
            </div>
            <div className='nz-my-activities-content'>
                <div className='nz-activities-grid'>
                    {loading ? (
                        <div className='nz-activities-status'>Loading...</div>
                    ) : error ? (
                        <div className='nz-activities-status'>{error}</div>
                    ) : showGrid ? (
                        <BasicGrid
                            gridRef={gridRef}
                            showGrid={true}
                            uniqueName={`${myActivitiesProps.uniqueName}-grid`}
                            allowAutoSizeColumn={false}
                            containerName='nz_my_activities'
                            instanceName='nz_my_activities'
                            featureId={myActivitiesProps.featureId}
                            allowColumnResize={true}
                            isExportOnCopy={true}
                            handleDownloadData={handleDownloadExcel}
                            exportFileName='myactivities'
                            rowData={rowData}
                            isReadOnly={true}
                            allowColumnFilter={true}
                            columnDefs={columnDefs}
                            allowPagination={true}
                            paginationAutoPageSize={true}
                            allowSort={myActivitiesProps.allowSort ?? true}
                            totalRecords={rowData.length}
                            featureData={undefined}
                        />
                    ) : (
                        <div className='nz-activities-status'>Activity log details not found.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export { MyActivities }
export default MyActivities
