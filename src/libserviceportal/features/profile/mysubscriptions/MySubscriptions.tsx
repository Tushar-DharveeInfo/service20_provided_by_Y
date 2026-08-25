
import { ReactNode, useState } from 'react'
import './MySubscriptions.css'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { CardLayout } from '../../../shared/cardlayout/CardLayout.tsx'
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate.ts'
import sampleUserLicenses from '../../../../serviceSampledata/auth/MySubscriptionsSampleData.json'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'

interface ISampleUserLicense {
    ProductName: string;
    _NZLicenseKey: string;
    StartDate: string;
    EndDate: string;
    UserCount: number;
    RackCount: number;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
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
    uniqueName: string;//uniqueName for the control and required
    featureId: string;// feature id
    headerText?: string;// header text coming from the selected menu item
    handleShowUserMessage?: (messageText: string) => void;
}

/* Card rows matching the NZLicenseKey license-card layout. */
const getLicenseFields = (license: ISampleUserLicense): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        { Name: "", Value: license._NZLicenseKey, Header: 1 },
        {
            Name: "Start Date",
            Value: FnConvertDateToUtcOrUtcToDate(license.StartDate, false, false),
            Group: "dates",
            Row: "inline"
        },
        {
            Name: "End Date",
            Value: FnConvertDateToUtcOrUtcToDate(license.EndDate, false, false),
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

    if (license.RackCount > 0) {
        fields.push({
            Name: "Rack Count",
            Value: String(license.RackCount),
            Group: "product",
            Row: "inline"
        });
    } else {
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
    const licenses =
        (mainAppContext.userInfoAndSubscription?.subscription as ISampleUserLicense[] | undefined)
        ?? sampleUserLicenses;

    return (
        <div key={mySubscriptionsProps.uniqueName} className='nz-my-subscriptions-container nz-wh-100'>
            <div className='nz-sub-header'>
                <Label
                    uniqueName={`${mySubscriptionsProps.uniqueName}-header`}
                    label={mySubscriptionsProps.headerText ?? "My Subscriptions"}
                    fontWeight='600' />
            </div>
            <div className='nz-my-subscriptions-list'>
                {licenses.map((license) => (
                    <CardLayout
                        key={license.EntID}
                        uniqueName={`${mySubscriptionsProps.uniqueName}-${license.EntID}`}
                        featureId={mySubscriptionsProps.featureId}
                        data={license}
                        fields={getLicenseFields(license)}
                        className='nz-my-subscriptions-card'
                        isSelected={selectedLicenseId === license.EntID}
                        hideRightMouseMenu={true}
                        keyboardNavigationOrientation={'vertical'}
                        tabIndex={0}
                        onClick={() => setSelectedLicenseId(license.EntID)} />
                ))}
            </div>
        </div>
    )
}

export { MySubscriptions }
export default MySubscriptions
