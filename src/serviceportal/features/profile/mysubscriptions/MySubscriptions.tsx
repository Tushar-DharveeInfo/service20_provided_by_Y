import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './MySubscriptions.css'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { CardLayout, ICardLayoutField } from './cardlayout/CardLayout.tsx'
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks.ts'
import { ISubDoc, IVssDownloadDoc, useSubs, useSubDownloads, useActivities } from '@n20a/libfsdb'
import { Dialog, DialogContent } from '@mui/material'
import { Close24x24, Plus } from '@n20a/libicon'
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx'
import { EditTextControl } from '@n20a/libform'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { BasicGrid } from '../../../shared/tablegrid/BasicGrid'
import type { IBasicGridColDef } from '../../../shared/allinterface/tablegrid/IBasicGrid'
import type { AgGridReact } from 'ag-grid-react'
import type { ICellRendererParams } from 'ag-grid-community'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface IMySubscriptions {
    uniqueName: string; // uniqueName for the control and required
    featureId: string; // feature id
    headerText?: string; // header text coming from the selected menu item
    handleShowUserMessage?: (messageText: string) => void;
}

/**
 * Parses any date format (Firestore timestamp object { seconds, nanoseconds },
 * object with toDate(), numeric epoch, or ISO date string) into a JavaScript Date.
 */
const parseToDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object') {
        if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
            return (value as { toDate: () => Date }).toDate();
        }
        if ('seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
            return new Date((value as { seconds: number }).seconds * 1000);
        }
        if ('_seconds' in value && typeof (value as { _seconds: number })._seconds === 'number') {
            return new Date((value as { _seconds: number })._seconds * 1000);
        }
    }
    if (typeof value === 'number') {
        return new Date(value < 1e11 ? value * 1000 : value);
    }
    if (typeof value === 'string') {
        const ms = Date.parse(value);
        return isNaN(ms) ? null : new Date(ms);
    }
    return null;
};

const toDateString = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const d = parseToDate(value);
    return d ? d.toISOString() : '';
};

const formatSubDate = (value: unknown): string => {
    const d = parseToDate(value);
    if (!d) return '';
    return FnConvertDateToUtcOrUtcToDate(d.toISOString(), false, false) || d.toLocaleDateString();
};

/* Helper to check whether a subscription license has expired. */
const isSubscriptionExpired = (endDateValue: unknown): boolean => {
    const d = parseToDate(endDateValue);
    if (!d) {
        return false;
    }
    return d.getTime() < Date.now();
};

const normalizeSub = (sub: Record<string, any>): ISubDoc => {
    const subsid = String(
        sub.subsid ?? sub._NZLicenseKey ?? sub._nzlicensekey ?? sub.licensekey ?? sub.id ?? ''
    ).trim();
    const product = String(
        sub.product ?? sub.ProductName ?? sub.productname ?? 'NetZoom'
    ).trim();
    const startDateRaw = toDateString(sub.startdate ?? sub.StartDate ?? sub.datecreated);
    const endDateRaw = toDateString(sub.enddate ?? sub.EndDate);
    const status = String(sub.status ?? sub.Status ?? '').trim();
    const purchaser = String(sub.purchaser ?? sub.Purchaser ?? '').trim();
    const orderid = String(sub.orderid ?? sub.OrderID ?? '').trim();
    const bid = String(sub.bid ?? '').trim();
    const cid = String(sub.cid ?? '').trim();
    const productkey = String(sub.productkey ?? sub.productKey ?? sub._NZLicenseKey ?? sub.licensekey ?? '').trim();
    const statusupdatedby = String(sub.statusupdatedby ?? '').trim();
    const statusreason = String(sub.statusreason ?? '').trim();
    const datecreated = toDateString(sub.datecreated);
    const monitor = Boolean(sub.monitor ?? false);
    const monitorupdated = toDateString(sub.monitorupdated);

    return {
        ...sub,
        bid,
        cid,
        orderid,
        monitorupdated,
        monitor,
        purchaser,
        subsid,
        product,
        productkey,
        status,
        statusupdatedby,
        statusreason,
        startdate: startDateRaw,
        enddate: endDateRaw,
        datecreated,
    };
};

/* Card fields configured to render:
 * Top Header row (space-between):
 *   Left:  Active Product: <ProductName>
 *   Right: Start Date: <StartDate>   End Date: <EndDate>
 * Bottom Detail row (space-between):
 *   Left:  Order ID: <OrderID>
 *   Right: Purchaser: <Purchaser>
 */
const getLicenseFields = (sub: ISubDoc): ICardLayoutField[] => {
    const isExpired = isSubscriptionExpired(sub.enddate);
    const statusText = sub.status
        ? (sub.status.charAt(0).toUpperCase() + sub.status.slice(1).toLowerCase())
        : (isExpired ? 'Expired' : 'Active');

    const productTitle = `${statusText} Product: ${sub.product || 'NetZoom'}`;
    const datesStr = `Start Date: ${formatSubDate(sub.startdate) || 'N/A'}   End Date: ${formatSubDate(sub.enddate) || 'N/A'}`;

    return [
        // Header slots (Header: 1 and Header: 2 trigger CardLayout's built-in header-row--space-between)
        {
            Name: "",
            Value: `Subscription: ${sub.subsid}`,
        },
        {
            Name: "",
            Value: productTitle,
            Group: "header-info-row",
            Row: "space-between",
        },
        {
            Name: "",
            Value: datesStr,
            Group: "header-info-row",
            Row: "space-between",
        },
        // Detail row with Row: 'space-between'
        {
            Name: "Order ID",
            Value: sub.orderid || sub.subsid || 'N/A',
            Group: "sub-info-row",
            Row: "space-between",
        },
        {
            Name: "Purchaser",
            Value: sub.purchaser || 'N/A',
            Group: "sub-info-row",
            Row: "space-between",
        },
    ];
};

const MySubscriptions = (mySubscriptionsProps: IMySubscriptions) => {
    const [selectedLicenseId, setSelectedLicenseId] = useState<string>();
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    statusBarContextRef.current = statusBarContext;

    const authSession = mainAppContext.authSession;
    const bid = String(authSession?.bid ?? '').trim();
    const cid = String(authSession?.cid ?? '').trim();

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [enteredSubsid, setEnteredSubsid] = useState<string>('');
    const [foundSub, setFoundSub] = useState<ISubDoc | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [promptMessage, setPromptMessage] = useState<string>('');
    const [isPromptOpen, setIsPromptOpen] = useState<boolean>(false);
    const [deleteSubTarget, setDeleteSubTarget] = useState<ISubDoc | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

    const [downloadList, setDownloadList] = useState<IVssDownloadDoc[]>([]);
    const downloadsGridRef = useRef<AgGridReact>(null);

    // Subcollection hook to manage downloads for the selected subscription
    const {
        items: subDownloads,
        getItems: getDownloadItems,
        reset: resetDownloads,
    } = useSubDownloads(bid, selectedLicenseId || '');

    const getDownloadItemsRef = useRef(getDownloadItems);
    getDownloadItemsRef.current = getDownloadItems;
    const resetDownloadsRef = useRef(resetDownloads);
    resetDownloadsRef.current = resetDownloads;
    const lastFetchedDownloadsKeyRef = useRef<string>('');

    useEffect(() => {
        if (!bid || !selectedLicenseId) {
            lastFetchedDownloadsKeyRef.current = '';
            resetDownloadsRef.current();
            setDownloadList([]);
            return;
        }

        const fetchKey = `${bid}_${selectedLicenseId}`;
        if (lastFetchedDownloadsKeyRef.current === fetchKey) {
            return;
        }
        lastFetchedDownloadsKeyRef.current = fetchKey;

        let isCancelled = false;
        void (async () => {
            statusBarContextRef.current?.setIsLoading?.(true);
            statusBarContextRef.current?.setLoadingLabel?.('Loading downloads...');
            try {
                const res = await getDownloadItemsRef.current();
                if (!isCancelled) {
                    if (Array.isArray(res) && res.length > 0) {
                        setDownloadList(res as unknown as IVssDownloadDoc[]);
                    } else {
                        setDownloadList([]);
                    }
                }
            } catch (err) {
                console.error("MySubscriptions: failed to get download items", err);
                if (!isCancelled) {
                    setDownloadList([]);
                }
            } finally {
                statusBarContextRef.current?.setIsLoading?.(false);
                statusBarContextRef.current?.setLoadingLabel?.('');
            }
        })();

        return () => {
            isCancelled = true;
            statusBarContextRef.current?.setIsLoading?.(false);
            statusBarContextRef.current?.setLoadingLabel?.('');
        };
    }, [bid, selectedLicenseId]);

    const effectiveDownloads = useMemo<IVssDownloadDoc[]>(() => {
        if (downloadList.length > 0) {
            return downloadList;
        }
        if (Array.isArray(subDownloads) && subDownloads.length > 0) {
            return subDownloads as unknown as IVssDownloadDoc[];
        }
        return [];
    }, [downloadList, subDownloads]);

    const showRightPane = Boolean(
        selectedLicenseId && effectiveDownloads.length > 0
    );

    const downloadColumnDefs = useMemo<IBasicGridColDef[]>(() => [
        {
            headerName: 'EQID',
            field: 'eqid',
            width: 140,
            resizable: true,
            sortable: true,
            filter: true,
        },
        {
            headerName: 'File Name',
            field: 'filename',
            flex: 1,
            minWidth: 200,
            resizable: true,
            sortable: true,
            filter: true,
        },
        {
            headerName: 'Date Used',
            field: 'dateused',
            width: 180,
            resizable: true,
            sortable: true,
            filter: true,
            comparator: (valueA: unknown, valueB: unknown) => {
                const timeA = parseToDate(valueA)?.getTime() ?? 0;
                const timeB = parseToDate(valueB)?.getTime() ?? 0;
                return timeA - timeB;
            },
            cellRenderer: (params: ICellRendererParams) => (
                <span>{params.value ? formatSubDate(params.value) || String(params.value) : ''}</span>
            ),
        },
    ], []);

    const handleDownloadDownloadsExcel = useCallback(() => {
        const rows: (string | number)[][] = [
            ['EQID', 'File Name', 'Date Used']
        ];
        effectiveDownloads.forEach((row) => {
            rows.push([
                String(row.eqid || ''),
                String(row.filename || ''),
                formatSubDate(row.dateused) || String(row.dateused || ''),
            ]);
        });

        if (rows.length <= 1) return;

        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Downloads');
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `downloads_${selectedLicenseId || 'sub'}.xlsx`);
        } catch (error) {
            console.error('MySubscriptions: failed to export downloads Excel', error);
        }
    }, [effectiveDownloads, selectedLicenseId]);

    // SMDB hook from @n20a/libfsdb to manage subscriptions for current user
    const { subs, loading, error, getSubs, createSub, updateSub, deleteSub } = useSubs(bid);

    // SMDB hook instance to query all subscriptions for the business
    const { subs: allBusinessSubs, getSubs: getAllBusinessSubs } = useSubs(bid);

    // SMDB hook to manage user activities and logging
    const { createActivity } = useActivities(bid);

    const getSubsRef = useRef(getSubs);
    getSubsRef.current = getSubs;
    const lastFetchedSubsKeyRef = useRef<string>('');

    useEffect(() => {
        if (!bid) {
            lastFetchedSubsKeyRef.current = '';
            return;
        }
        const fetchKey = `${bid}_${cid}`;
        if (lastFetchedSubsKeyRef.current === fetchKey) {
            return;
        }
        lastFetchedSubsKeyRef.current = fetchKey;

        let isCancelled = false;
        statusBarContextRef.current?.setIsLoading?.(true);
        statusBarContextRef.current?.setLoadingLabel?.('Loading subscriptions...');
        const filters = cid
            ? [{ field: 'cid', op: '==' as const, value: cid }]
            : undefined;
        void getSubsRef.current(filters).finally(() => {
            statusBarContextRef.current?.setIsLoading?.(false);
            statusBarContextRef.current?.setLoadingLabel?.('');
        });
        return () => {
            isCancelled = true;
            statusBarContextRef.current?.setIsLoading?.(false);
            statusBarContextRef.current?.setLoadingLabel?.('');
        };
    }, [bid, cid]);

    // Live data from useSubs hook
    const licenses = useMemo<ISubDoc[]>(() => {
        if (Array.isArray(subs)) {
            return subs.map(normalizeSub);
        }
        return [];
    }, [subs]);

    const isSubValidated = Boolean(
        foundSub &&
        enteredSubsid.trim() &&
        foundSub.subsid?.trim().toLowerCase() === enteredSubsid.trim().toLowerCase()
    );

    const handleFindSub = async (targetSubsid?: string): Promise<ISubDoc | null> => {
        const query = (targetSubsid ?? enteredSubsid).trim();
        if (!query) {
            setPromptMessage("Please enter a Subscription ID.");
            setIsPromptOpen(true);
            return null;
        }

        try {
            setIsSearching(true);
            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Searching subscription...');
            let pool = allBusinessSubs;
            if (!pool || pool.length === 0) {
                const fetched = await getAllBusinessSubs();
                if (Array.isArray(fetched)) {
                    pool = fetched;
                }
            }

            const matching = pool?.find((item: any) =>
                String(item.subsid ?? item.id ?? item._NZLicenseKey ?? '').trim().toLowerCase() === query.toLowerCase()
            );

            if (!matching) {
                setPromptMessage("Subscription is not recognized! try again.");
                setIsPromptOpen(true);
                setFoundSub(null);
                return null;
            }

            const matchedSubDoc: ISubDoc = {
                bid: String(matching.bid || bid || ''),
                cid: String(matching.cid || cid || ''),
                orderid: String(matching.orderid || ''),
                monitorupdated: String(matching.monitorupdated || ''),
                monitor: Boolean(matching.monitor),
                purchaser: String(matching.purchaser || ''),
                subsid: String(matching.subsid || query),
                product: String(matching.product || matching.ProductName || ''),
                status: String(matching.status || 'active'),
                statusupdatedby: String(matching.statusupdatedby || cid || 'User'),
                statusreason: String(matching.statusreason || ''),
                startdate: String(matching.startdate || matching.datecreated || ''),
                enddate: String(matching.enddate || ''),
                datecreated: String(matching.datecreated || ''),
                productkey: ''
            };

            setFoundSub(matchedSubDoc);
            setEnteredSubsid(matchedSubDoc.subsid);
            return matchedSubDoc;
        } catch (err) {
            console.error("MySubscriptions: error searching subscription", err);
            setPromptMessage("Subscription is not recognized! try again.");
            setIsPromptOpen(true);
            setFoundSub(null);
            return null;
        } finally {
            setIsSearching(false);
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
    };

    const handleSaveSubscription = async () => {
        const query = enteredSubsid.trim();
        if (!query) {
            setPromptMessage("Please enter a Subscription ID.");
            setIsPromptOpen(true);
            return;
        }

        let subRecord = foundSub;
        if (!subRecord || subRecord.subsid?.toLowerCase() !== query.toLowerCase()) {
            subRecord = await handleFindSub(query);
            if (!subRecord) {
                return;
            }
        }

        try {
            setIsSaving(true);
            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Adding subscription...');

            const now = new Date().toISOString();
            const subDataToSave: ISubDoc = {
                ...subRecord,
                bid: bid,
                cid: cid,
                subsid: subRecord.subsid || query,
                statusupdatedby: cid || subRecord.statusupdatedby || 'User',
                monitorupdated: now,
            };

            const result = await updateSub(String(subDataToSave.subsid), subDataToSave as any);
            if (!result || result.success === false) {
                await createSub(subDataToSave as any);
            }

            const logMessage = `${cid || 'User'} of ${bid} added subscription ${subDataToSave.subsid} successfully.`;
            try {
                if (mainAppContext.createActivityLog) {
                    await mainAppContext.createActivityLog(logMessage);
                }
            } catch (logErr) {
                console.error("MySubscriptions: mainAppContext.createActivityLog failed", logErr);
            }

            try {
                if (bid) {
                    await createActivity({
                        bid,
                        cid: cid || 'User',
                        activityid: `activity_${cid || 'User'}_${Date.now()}`,
                        message: logMessage,
                        monitorupdated: now,
                        monitor: false,
                        datecreated: now,
                    });
                }
            } catch (directLogErr) {
                console.error("MySubscriptions: direct createActivity failed", directLogErr);
            }

            setPromptMessage("Subscription added successfully.");
            setIsPromptOpen(true);
            setIsAddModalOpen(false);
            setEnteredSubsid('');
            setFoundSub(null);

            // Re-fetch user's subscriptions
            lastFetchedSubsKeyRef.current = '';
            await getSubs(cid ? [{ field: 'cid', op: '==' as const, value: cid }] : undefined);
        } catch (err: any) {
            console.error("MySubscriptions: failed to save subscription", err);
            setPromptMessage(`Failed to save subscription: ${err?.message || 'Unknown error'}`);
            setIsPromptOpen(true);
        } finally {
            setIsSaving(false);
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
    };

    const handleDeleteClick = (sub: ISubDoc) => {
        setDeleteSubTarget(sub);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteSubTarget) return;
        const target = deleteSubTarget;
        const subsidToDelete = String(
            target.subsid || (target as any)._NZLicenseKey || (target as any).EntID || ''
        ).trim();

        if (!subsidToDelete) {
            setIsDeleteConfirmOpen(false);
            setDeleteSubTarget(null);
            return;
        }

        try {
            setIsDeleteConfirmOpen(false);
            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Deleting subscription...');

            const result = await deleteSub(subsidToDelete);
            if (!result || result.success === false) {
                console.error("MySubscriptions: deleteSub returned failure", result?.error);
            }

            const now = new Date().toISOString();
            const logMessage = `${cid || 'User'} of ${bid} deleted subscription ${subsidToDelete} successfully.`;
            try {
                if (mainAppContext.createActivityLog) {
                    await mainAppContext.createActivityLog(logMessage);
                }
            } catch (logErr) {
                console.error("MySubscriptions: mainAppContext.createActivityLog failed", logErr);
            }

            try {
                if (bid) {
                    await createActivity({
                        bid,
                        cid: cid || 'User',
                        activityid: `activity_${cid || 'User'}_${Date.now()}`,
                        message: logMessage,
                        monitorupdated: now,
                        monitor: false,
                        datecreated: now,
                    });
                }
            } catch (directLogErr) {
                console.error("MySubscriptions: direct createActivity failed", directLogErr);
            }

            if (selectedLicenseId === target.subsid) {
                setSelectedLicenseId(undefined);
                setDownloadList([]);
                resetDownloads();
            }

            setPromptMessage("Subscription deleted successfully.");
            setIsPromptOpen(true);

            // Re-fetch user's subscriptions
            lastFetchedSubsKeyRef.current = '';
            await getSubs(cid ? [{ field: 'cid', op: '==' as const, value: cid }] : undefined);
        } catch (err: any) {
            console.error("MySubscriptions: failed to delete subscription", err);
            setPromptMessage(`Failed to delete subscription: ${err?.message || 'Unknown error'}`);
            setIsPromptOpen(true);
        } finally {
            setDeleteSubTarget(null);
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
    };

    const subscriptionsListContent = (
        <div className='nz-my-subscriptions-list'>
            {loading && (!subs || subs.length === 0) ? (
                <div style={{ padding: '1rem', color: 'var(--textsecondary, #6b7280)' }}>
                    Loading subscriptions...
                </div>
            ) : null}
            {error ? (
                <div style={{ padding: '1rem', color: 'red' }}>
                    Error: {error}
                </div>
            ) : null}
            {!loading && licenses.length === 0 ? (
                <div style={{
                    padding: '1rem', color: 'var(--textsecondary, #6b7280)',
                    height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left'
                }}>
                    No subscriptions found.
                </div>
            ) : null}
            {licenses.map((sub) => {
                const isExpired = isSubscriptionExpired(sub.enddate);
                return (
                    <CardLayout
                        key={sub.subsid}
                        uniqueName={`${mySubscriptionsProps.uniqueName}-${sub.subsid}`}
                        featureId={mySubscriptionsProps.featureId}
                        data={sub}
                        fields={getLicenseFields(sub)}
                        className={`nz-my-subscriptions-card ${isExpired ? 'nz-my-subscriptions-card-expired' : ''}`.trim()}
                        isSelected={selectedLicenseId === sub.subsid}
                        hideRightMouseMenu={true}
                        keyboardNavigationOrientation={'vertical'}
                        tabIndex={0}
                        onClick={() => setSelectedLicenseId(sub.subsid)}
                        allowDeleteButton={true}
                        handleMouseForDelete={(data) => handleDeleteClick(data as ISubDoc)}
                    />
                );
            })}
        </div>
    );

    return (
        <div key={mySubscriptionsProps.uniqueName} className='nz-my-subscriptions-container nz-wh-100'>
            <div className='nz-sub-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Label
                    uniqueName={`${mySubscriptionsProps.uniqueName}-header`}
                    label={mySubscriptionsProps.headerText ?? "My Subscriptions"}
                    fontWeight='600' />
                <button
                    type="button"
                    className="nz-add-subscription-icon-btn"
                    title="Add Subscription"
                    aria-label="Add Subscription"
                    onClick={() => {
                        setEnteredSubsid('');
                        setFoundSub(null);
                        setIsAddModalOpen(true);
                        statusBarContext?.setIsLoading?.(true);
                        statusBarContext?.setLoadingLabel?.('Loading business subscriptions...');
                        void getAllBusinessSubs().finally(() => {
                            statusBarContext?.setIsLoading?.(false);
                            statusBarContext?.setLoadingLabel?.('');
                        });
                    }}
                >
                    <Plus size={18} />
                </button>
            </div>
            <div className='nz-my-subscriptions-body'>
                {showRightPane ? (
                    <Splitter className="nz-wh-100 nz-my-subscriptions-splitter" layout="horizontal">
                        <SplitterPanel size={40} minSize={25} className="nz-my-subscriptions-left-pane">
                            {subscriptionsListContent}
                        </SplitterPanel>
                        <SplitterPanel size={60} minSize={30} className="nz-my-subscriptions-right-pane">
                            <div className="nz-wh-100" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                <div className="nz-sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Label
                                        uniqueName={`${mySubscriptionsProps.uniqueName}-downloads-header`}
                                        label={`Downloads (${selectedLicenseId})`}
                                        fontWeight="600"
                                    />
                                </div>
                                <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                                    <BasicGrid
                                        gridRef={downloadsGridRef}
                                        showGrid={true}
                                        uniqueName={`${mySubscriptionsProps.uniqueName}-downloads-grid`}
                                        allowAutoSizeColumn={false}
                                        containerName="nz_sub_downloads"
                                        instanceName="nz_sub_downloads"
                                        featureId={mySubscriptionsProps.featureId}
                                        allowColumnResize={true}
                                        isExportOnCopy={true}
                                        handleDownloadData={handleDownloadDownloadsExcel}
                                        exportFileName={`downloads_${selectedLicenseId}`}
                                        rowData={effectiveDownloads}
                                        isReadOnly={true}
                                        allowColumnFilter={true}
                                        columnDefs={downloadColumnDefs}
                                        allowPagination={true}
                                        paginationAutoPageSize={true}
                                        allowSort={true}
                                        totalRecords={effectiveDownloads.length}
                                        featureData={undefined}
                                    />
                                </div>
                            </div>
                        </SplitterPanel>
                    </Splitter>
                ) : (
                    subscriptionsListContent
                )}
            </div>

            {/* Add Subscription Modal */}
            <Dialog
                open={isAddModalOpen}
                className="nz-delete-row-dialog"
                maxWidth="md"
                fullWidth={true}
                onClose={() => setIsAddModalOpen(false)}
            >
                <div className="nz-sub-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px', alignItems: 'center' }}>
                    <Label uniqueName="add-sub-modal-title" label="Add Subscription" fontWeight="600" />
                    <div
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <Close24x24 size={18} fill="none" strokeWidth={1.5} />
                    </div>
                </div>
                <DialogContent style={{ padding: '16px 20px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div
                        className="nz-add-sub-fields"
                        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = (e.currentTarget.querySelector('#subsid') || e.currentTarget.querySelector('input')) as HTMLInputElement;
                                const val = (input?.value ?? enteredSubsid).trim();
                                if (val) {
                                    void handleFindSub(val);
                                }
                            }
                        }}
                    >
                        {/* subsid with focus out (onBlur) lookup */}
                        <div
                            onInput={(e) => {
                                const input = e.currentTarget.querySelector('input');
                                const val = (input?.value ?? '').trim();
                                if (foundSub && (!val || foundSub.subsid?.trim().toLowerCase() !== val.toLowerCase())) {
                                    setFoundSub(null);
                                }
                            }}
                            onBlur={(e) => {
                                const related = e.relatedTarget as HTMLElement | null;
                                if (related && (related.closest('.nz-dialog-footer') || related.closest('.nz-sub-header'))) {
                                    return;
                                }
                                const input = e.currentTarget.querySelector('input');
                                const val = (input?.value ?? enteredSubsid).trim();
                                if (val && (!foundSub || foundSub.subsid?.toLowerCase() !== val.toLowerCase())) {
                                    void handleFindSub(val);
                                }
                            }}
                        >
                            <EditTextControl
                                id="subsid"
                                name="subsid"
                                label="Subscription ID (subsid) *"
                                value={enteredSubsid}
                                placeholder="Enter Subscription ID..."
                                onChange={(val) => {
                                    setEnteredSubsid(val);
                                    const trimmed = val.trim();
                                    if (trimmed && (!foundSub || foundSub.subsid?.toLowerCase() !== trimmed.toLowerCase())) {
                                        void handleFindSub(trimmed);
                                    } else if (!trimmed) {
                                        setFoundSub(null);
                                    }
                                }}
                            />
                        </div>

                        {/* Read-only controls from ISubDoc */}
                        <EditTextControl
                            id="product"
                            name="product"
                            label="Product"
                            value={foundSub?.product ?? ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="orderid"
                            name="orderid"
                            label="Order ID"
                            value={foundSub?.orderid ?? ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="purchaser"
                            name="purchaser"
                            label="Purchaser"
                            value={foundSub?.purchaser ?? ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="startdate"
                            name="startdate"
                            label="Start Date"
                            value={foundSub?.startdate ? formatSubDate(foundSub.startdate) : ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="enddate"
                            name="enddate"
                            label="End Date"
                            value={foundSub?.enddate ? formatSubDate(foundSub.enddate) : ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="bid"
                            name="bid"
                            label="Business ID (bid)"
                            value={foundSub?.bid || bid}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="cid"
                            name="cid"
                            label="Contact ID (cid)"
                            value={foundSub?.cid || cid}
                            disabled={true}
                            readOnly={true}
                        />
                    </div>
                </DialogContent>
                <div className="nz-dialog-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '10px 16px', borderTop: '1px solid var(--borderandscrollbar, #e0e0e0)' }}>
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        style={{
                            padding: '4px 14px',
                            borderRadius: '4px',
                            border: '1px solid var(--borderandscrollbar, #ccc)',
                            background: 'var(--bgfeaturepane1, #fff)',
                            color: 'var(--textprimary, #333)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            height: '30px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="nz-add-subscription-btn"
                        onClick={() => void handleSaveSubscription()}
                        disabled={!isSubValidated || isSaving || isSearching}
                        style={{ height: '30px', padding: '0 16px' }}
                    >
                        {isSaving ? 'Saving...' : 'Add Subscription'}
                    </button>
                </div>
            </Dialog>

            {/* Prompt Dialog */}
            <YesNoFormContainer
                isOpen={isPromptOpen}
                uniqueName="my-subscriptions-prompt-dialog"
                message={promptMessage}
                dialogTitle="Information"
                showOkButton={true}
                handleOkButtonClick={() => setIsPromptOpen(false)}
                handleYesButtonClick={() => setIsPromptOpen(false)}
                handleNoButtonClick={() => setIsPromptOpen(false)}
            />

            {/* Delete Confirmation Dialog */}
            <YesNoFormContainer
                isOpen={isDeleteConfirmOpen}
                uniqueName="my-subscriptions-delete-confirm-dialog"
                message={`Are you sure you want to delete subscription ${deleteSubTarget?.subsid || ''}?`}
                dialogTitle="Delete Confirmation"
                showOkButton={false}
                handleYesButtonClick={() => void handleConfirmDelete()}
                handleNoButtonClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeleteSubTarget(null);
                }}
            />
        </div>
    )
}

export { MySubscriptions }
export default MySubscriptions
