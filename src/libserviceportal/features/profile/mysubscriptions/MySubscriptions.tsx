import { useEffect, useMemo, useState } from 'react'
import './MySubscriptions.css'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { CardLayout, ICardLayoutField } from './cardlayout/CardLayout.tsx'
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks.ts'
import { ISubDoc, useSubs, useActivities } from '@n20a/libfsdb'
import { Dialog, DialogContent } from '@mui/material'
import { Close24x24, Plus } from '@n20a/libicon'
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx'
import { EditTextControl } from '@n20a/libform'

interface ISampleUserLicense {
    ProductName: string;
    _NZLicenseKey: string;
    licenseKey?: string;
    StartDate: any;
    EndDate: any;
    UserCount: number;
    RackCount: number;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
    status?: string;
    purchaser?: string;
    orderid?: string;
    [key: string]: unknown;
}

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

const normalizeSub = (sub: Record<string, any>): ISampleUserLicense => {
    const licenseKey = String(
        sub._NZLicenseKey ?? sub._nzlicensekey ?? sub.subsid ?? sub.licensekey ?? sub.subsid ?? sub.id
    ).trim();
    const productName = String(
        sub.ProductName ?? sub.productname ?? sub.product ?? 'NetZoom'
    ).trim();
    const startDateRaw = sub.startdate ?? sub.StartDate ?? sub.datecreated;
    const endDateRaw = sub.enddate ?? sub.EndDate;
    const userCount = Number(
        sub.UserCount ?? sub.usercount ?? (sub.estimatedusers ?? 0)
    );
    const rackCount = Number(
        sub.RackCount ?? sub.rackcount ?? (sub.estimatedracks ?? 0)
    );
    const status = String(sub.status ?? sub.Status ?? '').trim();
    const purchaser = String(sub.purchaser ?? sub.Purchaser ?? '').trim();
    const orderid = String(sub.orderid ?? sub.OrderID ?? '').trim();

    return {
        ProductName: productName,
        _NZLicenseKey: licenseKey,
        StartDate: startDateRaw,
        EndDate: endDateRaw,
        UserCount: userCount,
        RackCount: rackCount,
        Secured: Boolean(sub.Secured ?? sub.secured ?? false),
        IsNZ: Boolean(sub.IsNZ ?? sub.isnz ?? true),
        EntID: (sub.subsid ?? sub.id) || `sub-${Math.random().toString(36).slice(2, 9)}`,
        RecID: String(sub.RecID ?? sub.recid ?? sub.subsid ?? sub.id).trim(),
        LastUpdated: String(sub.LastUpdated ?? sub.lastupdated ?? sub.dateupdated ?? '').trim(),
        EntityName: String(sub.EntityName ?? sub.entityname ?? 'NZLicenseKey').trim(),
        status: status || undefined,
        purchaser: purchaser || undefined,
        orderid: orderid || undefined,
        ...sub,
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
const getLicenseFields = (license: ISampleUserLicense): ICardLayoutField[] => {
    const isExpired = isSubscriptionExpired(license.EndDate);
    const statusText = license.status
        ? (license.status.charAt(0).toUpperCase() + license.status.slice(1).toLowerCase())
        : (isExpired ? 'Expired' : 'Active');

    const productTitle = `${statusText} Product: ${license.ProductName || 'NetZoom'}`;
    const datesStr = `Start Date: ${formatSubDate(license.StartDate) || 'N/A'}   End Date: ${formatSubDate(license.EndDate) || 'N/A'}`;

    return [
        // Header slots (Header: 1 and Header: 2 trigger CardLayout's built-in header-row--space-between)
        {
            Name: "",
            Value: `Subscription: ${license._NZLicenseKey}`,
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
            Value: license.orderid || license.EntID || 'N/A',
            Group: "sub-info-row",
            Row: "space-between",
        },
        {
            Name: "Purchaser",
            Value: license.purchaser || 'N/A',
            Group: "sub-info-row",
            Row: "space-between",
        },
    ];
};

const MySubscriptions = (mySubscriptionsProps: IMySubscriptions) => {
    const [selectedLicenseId, setSelectedLicenseId] = useState<string>();
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const userInfo = mainAppContext.userInfoAndSubscription?.userInfo;
    const authSession = mainAppContext.authSession;
    const bid = String(userInfo?.bid ?? authSession?.bid ?? '').trim();
    const cid = String(userInfo?.cid ?? authSession?.cid ?? '').trim();

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [enteredSubsid, setEnteredSubsid] = useState<string>('');
    const [foundSub, setFoundSub] = useState<ISubDoc | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [promptMessage, setPromptMessage] = useState<string>('');
    const [isPromptOpen, setIsPromptOpen] = useState<boolean>(false);

    // SMDB hook from @n20a/libfsdb to manage subscriptions for current user
    const { subs, loading, error, getSubs, createSub, updateSub } = useSubs(bid);

    // SMDB hook instance to query all subscriptions for the business
    const { subs: allBusinessSubs, getSubs: getAllBusinessSubs } = useSubs(bid);

    // SMDB hook to manage user activities and logging
    const { createActivity } = useActivities(bid);

    useEffect(() => {
        if (!bid) {
            return;
        }
        const filters = cid
            ? [{ field: 'cid', op: '==' as const, value: cid }]
            : undefined;
        void getSubs(filters);
    }, [bid, cid, getSubs]);

    // Live data from useSubs hook
    const licenses = useMemo<ISampleUserLicense[]>(() => {
        if (Array.isArray(subs)) {
            return subs.map(normalizeSub);
        }
        return [];
    }, [subs]);

    const handleFindSub = async (targetSubsid?: string): Promise<ISubDoc | null> => {
        const query = (targetSubsid ?? enteredSubsid).trim();
        if (!query) {
            setPromptMessage("Please enter a Subscription ID.");
            setIsPromptOpen(true);
            return null;
        }

        try {
            setIsSearching(true);
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
        }
    };

    const handleVerify = async () => {
        await handleFindSub(enteredSubsid);
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
                        void getAllBusinessSubs();
                    }}
                >
                    <Plus size={18} />
                </button>
            </div>
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
                {licenses.map((license) => {
                    const isExpired = isSubscriptionExpired(license.EndDate);
                    return (
                        <CardLayout
                            key={license.EntID}
                            uniqueName={`${mySubscriptionsProps.uniqueName}-${license.EntID}`}
                            featureId={mySubscriptionsProps.featureId}
                            data={license}
                            fields={getLicenseFields(license)}
                            className={`nz-my-subscriptions-card ${isExpired ? 'nz-my-subscriptions-card-expired' : ''}`.trim()}
                            isSelected={selectedLicenseId === license.EntID}
                            hideRightMouseMenu={true}
                            keyboardNavigationOrientation={'vertical'}
                            tabIndex={0}
                            onClick={() => setSelectedLicenseId(license.EntID)}
                        />
                    );
                })}
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
                            onBlur={(e) => {
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
                                    setFoundSub(null);
                                    const trimmed = val.trim();
                                    if (trimmed && (!foundSub || foundSub.subsid?.toLowerCase() !== trimmed.toLowerCase())) {
                                        void handleFindSub(trimmed);
                                    }
                                }}
                            />
                        </div>

                        {/* All 13 read-only controls from ISubDoc */}
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
                            id="status"
                            name="status"
                            label="Status"
                            value={foundSub?.status ?? ''}
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
                        <EditTextControl
                            id="statusupdatedby"
                            name="statusupdatedby"
                            label="Status Updated By"
                            value={foundSub?.statusupdatedby ?? ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="statusreason"
                            name="statusreason"
                            label="Status Reason"
                            value={foundSub?.statusreason ?? ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="datecreated"
                            name="datecreated"
                            label="Date Created"
                            value={foundSub?.datecreated ? formatSubDate(foundSub.datecreated) : ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="monitor"
                            name="monitor"
                            label="Monitor"
                            value={foundSub ? String(foundSub.monitor ?? false) : ''}
                            disabled={true}
                            readOnly={true}
                        />
                        <EditTextControl
                            id="monitorupdated"
                            name="monitorupdated"
                            label="Monitor Updated"
                            value={foundSub?.monitorupdated ? formatSubDate(foundSub.monitorupdated) : ''}
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
                        disabled={isSaving}
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
        </div>
    )
}

export { MySubscriptions }
export default MySubscriptions
