
import { useEffect, useMemo, useRef } from 'react'
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
        },
        {
            headerName: 'Activity ID',
            field: 'activityid',
            width: 200,
            resizable: true,
        },
        {
            headerName: 'Bid',
            field: 'bid',
            width: 120,
            resizable: true,
        },
        {
            headerName: 'Cid',
            field: 'cid',
            width: 160,
            resizable: false,
        },
    ], []);

    const rowData = activities ?? [];
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
