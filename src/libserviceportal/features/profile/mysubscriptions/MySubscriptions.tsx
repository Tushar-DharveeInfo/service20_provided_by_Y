import { ReactNode, useEffect, useMemo, useState } from 'react'
import './MySubscriptions.css'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { CardLayout } from './cardlayout/CardLayout.tsx'
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'
import { useSubs } from '@n20a/libfsdb'

interface ISampleUserLicense {
    ProductName: string;
    _NZLicenseKey: string;
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

interface ICardLayoutField {
    Name: string;
    Value: string;
    ValueContent?: ReactNode;
    Header?: number | boolean;
    Group?: string;
    Row?: 'space-between' | 'inline';
    disabledCheckbox?: boolean;
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
    const entId = String(sub.EntID ?? sub.entid ?? sub.subsid ?? sub.id ?? '').trim();
    const licenseKey = String(
        sub._NZLicenseKey ?? sub._nzlicensekey ?? sub.subsid ?? sub.licensekey ?? entId
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
        EntID: entId || `sub-${Math.random().toString(36).slice(2, 9)}`,
        RecID: String(sub.RecID ?? sub.recid ?? entId).trim(),
        LastUpdated: String(sub.LastUpdated ?? sub.lastupdated ?? sub.dateupdated ?? '').trim(),
        EntityName: String(sub.EntityName ?? sub.entityname ?? 'NZLicenseKey').trim(),
        status: status || undefined,
        purchaser: purchaser || undefined,
        orderid: orderid || undefined,
        ...sub,
    };
};

/* Card rows matching the NZLicenseKey license-card layout. */
const getLicenseFields = (license: ISampleUserLicense): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        { Name: "", Value: license._NZLicenseKey || license.EntID, Header: 1 },
        {
            Name: "Start Date",
            Value: formatSubDate(license.StartDate) || 'N/A',
            Group: "dates",
            Row: "inline"
        },
        {
            Name: "End Date",
            Value: formatSubDate(license.EndDate) || 'N/A',
            Group: "dates",
            Row: "inline"
        },
        {
            Name: "Product Name",
            Value: license.ProductName,
            Group: "product",
            Row: "inline"
        }
    ];

    if (license.status) {
        fields.push({
            Name: "Status",
            Value: String(license.status),
            Group: "status",
            Row: "inline"
        });
    }

    if (license.purchaser) {
        fields.push({
            Name: "Purchaser",
            Value: String(license.purchaser),
            Group: "purchaser",
            Row: "inline"
        });
    }

    if (license.orderid) {
        fields.push({
            Name: "Order ID",
            Value: String(license.orderid),
            Group: "order",
            Row: "inline"
        });
    }

    if (license.RackCount > 0) {
        fields.push({
            Name: "Rack Count",
            Value: String(license.RackCount),
            Group: "product",
            Row: "inline"
        });
    } else if (license.UserCount > 0) {
        fields.push({
            Name: "User Count",
            Value: String(license.UserCount),
            Group: "product",
            Row: "inline"
        });
    }

    return fields;
};

const MySubscriptions = (mySubscriptionsProps: IMySubscriptions) => {
    const [selectedLicenseId, setSelectedLicenseId] = useState<string>();
    const mainAppContext = useMainAppContext();
    const userInfo = mainAppContext.userInfoAndSubscription?.userInfo;
    const bid = String(userInfo?.bid ?? '').trim();
    const cid = String(userInfo?.cid ?? '').trim();

    // SMDB hook from @n20a/libfsdb to manage subscriptions
    const { subs, loading, error, getSubs } = useSubs(bid);

    useEffect(() => {
        if (!bid) {
            return;
        }
        const filters = cid
            ? [{ field: 'cid', op: '==' as const, value: cid }]
            : undefined;
        void getSubs(filters);
    }, [bid, cid, getSubs]);

    // Live data from useSubs hook - static data removed
    const licenses = useMemo<ISampleUserLicense[]>(() => {
        if (Array.isArray(subs)) {
            console.log('subs', subs)
            return subs.map(normalizeSub);
        }
        return [];
    }, [subs]);

    return (
        <div key={mySubscriptionsProps.uniqueName} className='nz-my-subscriptions-container nz-wh-100'>
            <div className='nz-sub-header'>
                <Label
                    uniqueName={`${mySubscriptionsProps.uniqueName}-header`}
                    label={mySubscriptionsProps.headerText ?? "My Subscriptions"}
                    fontWeight='600' />
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
                    <div style={{ padding: '1rem', color: 'var(--textsecondary, #6b7280)' }}>
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
                            onClick={() => setSelectedLicenseId(license.EntID)} />
                    );
                })}
            </div>
        </div>
    )
}

export { MySubscriptions }
export default MySubscriptions
