import { useEffect, useMemo, useState } from 'react'
import './MySubscriptions.css'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { CardLayout, ICardLayoutField } from './cardlayout/CardLayout.tsx'
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'
import { useSubs } from '@n20a/libfsdb'

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
            Value: license._NZLicenseKey,
            Header: 1,
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
                            onClick={() => setSelectedLicenseId(license.EntID)}
                        />
                    );
                })}
            </div>
        </div>
    )
}

export { MySubscriptions }
export default MySubscriptions
