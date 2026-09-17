
import { useEffect, useMemo, useRef, useState } from 'react'
import './MyProfile.css'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { SettingsLibForm } from '../../../shared/settingsform/settingslibform/SettingsLibForm.tsx'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'
import { useStatusBarContext } from '../../../shared/context/hooks/StatusBarHooks.ts'
import { myProfileControls } from './MyProfileControls.ts'
import { FnBuildMyProfileString } from '../../allcommon/FnBuildMyProfileProfileString.ts'
import { IContactDoc, useContacts } from '@n20a/libfsdb'
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx'

interface IMyProfile {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;// feature id
    headerText?: string;// header text coming from the selected menu item
    handleShowUserMessage?: (messageText: string) => void;
}

const MyProfile = (myProfileProps: IMyProfile) => {
    const mainAppContext = useMainAppContext();
    const statusBarContext = useStatusBarContext();
    const headerTitle = myProfileProps.headerText ?? "My Profile";
    const authUser = mainAppContext.authSession;
    const bid = String(authUser?.bid ?? '').trim();
    const cid = String(authUser?.cid ?? '').trim();

    const [popupOpen, setPopupOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const { contacts, loading, error, getContact, updateContact, createContact } = useContacts(bid);

    useEffect(() => {
        if (bid && cid) {
            getContact(cid);
        }
    }, [bid, cid, getContact]);

    useEffect(() => {
        if (loading) {
            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Loading contacts...');
        } else {
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
        return () => {
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        };
    }, [loading, statusBarContext]);

    useEffect(() => {
        if (error) {
            console.error("MyProfile: error loading contacts", error);
            myProfileProps.handleShowUserMessage?.(`Error loading contacts: ${error}`);
        }
    }, [error, myProfileProps]);

    const profileString = useMemo(() => {
        if (contacts) {
            return authUser ? FnBuildMyProfileString(authUser, contacts as unknown as IContactDoc) : "[]";
        }
        return "[]";
    }, [authUser, contacts]);

    const handleSaveProfile = async (formDataString?: string) => {
        if (!formDataString) return;

        let mergedData: Record<string, any> = {};
        try {
            const parsed = JSON.parse(formDataString);
            if (parsed?.TableSections) {
                for (const secKey of Object.keys(parsed.TableSections)) {
                    mergedData = { ...mergedData, ...parsed.TableSections[secKey] };
                }
            } else if (Array.isArray(parsed) && parsed[0]) {
                mergedData = parsed[0];
            } else if (typeof parsed === 'object' && parsed !== null) {
                mergedData = parsed;
            }
        } catch (err) {
            console.error("MyProfile: failed to parse formDataString", err);
            return;
        }

        if (!bid || !cid) {
            console.error("MyProfile: missing bid or cid", { bid, cid });
            setPopupMessage("Failed to save address: user session not found.");
            setPopupOpen(true);
            myProfileProps.handleShowUserMessage?.("Failed to save address: user session not found.");
            return;
        }

        const now = new Date().toISOString();

        // Build contact document updates
        const contactUpdates: Record<string, any> = {
            address1: String(mergedData.Address1 ?? ''),
            address2: String(mergedData.Address2 ?? ''),
            city: String(mergedData.City ?? ''),
            state: String(mergedData.State ?? ''),
            country: String(mergedData.Country ?? ''),
            zip: String(mergedData.Zip ?? ''),
            countrycode: String(mergedData.CountryCode ?? ''),
            timezoneoffset: mergedData.TimezoneOffset !== undefined && mergedData.TimezoneOffset !== ''
                ? Number(mergedData.TimezoneOffset)
                : 0,
            donotcallme: Boolean(mergedData.Donotcallme),
            removemefrommailinglist: Boolean(mergedData.Removemefrommailinglist),
            smsoptin: Boolean(mergedData.Smsoptin),
            dateupdated: now,
            monitorupdated: now,
        };

        if (mergedData.Phone !== undefined && mergedData.Phone !== '') {
            contactUpdates.phone = String(mergedData.Phone);
        }
        if (mergedData.Email !== undefined && mergedData.Email !== '') {
            contactUpdates.email = String(mergedData.Email);
        }
        if (mergedData.Name !== undefined && mergedData.Name !== '') {
            contactUpdates.cname = String(mergedData.Name);
        }

        try {
            statusBarContext?.setIsLoading?.(true);
            statusBarContext?.setLoadingLabel?.('Saving profile address...');

            let result: any = null;
            if (contacts && (Array.isArray(contacts) ? contacts.length > 0 : Object.keys(contacts).length > 0)) {
                result = await updateContact(cid, contactUpdates);
            } else {
                result = await createContact({
                    bid,
                    cid,
                    cname: authUser?.displayName ?? authUser?.username ?? "User",
                    email: authUser?.email ?? "",
                    phone: authUser?.phoneNumber ?? "",
                    role: "User",
                    status: "Active",
                    contacttype: "User",
                    monitor: false,
                    datecreated: now,
                    dateupdated: now,
                    monitorupdated: now,
                    ...contactUpdates,
                });
            }

            if (result && result.success !== false) {
                try {
                    await mainAppContext.createActivityLog?.(`${cid} of ${bid} updated profile address successfully.`);
                } catch (logErr) {
                    console.error("MyProfile: createActivityLog failed", logErr);
                }
                setPopupMessage("Profile address saved successfully.");
                setPopupOpen(true);
                myProfileProps.handleShowUserMessage?.("Profile address saved successfully.");
                await getContact(cid);
            } else {
                console.error("MyProfile: updateContact failed", result?.error);
                const errMsg = `Failed to save address: ${result?.error || 'Unknown error'}`;
                setPopupMessage(errMsg);
                setPopupOpen(true);
                myProfileProps.handleShowUserMessage?.(errMsg);
            }
        } catch (err: any) {
            console.error("MyProfile: saveProfile exception", err);
            const errMsg = `Failed to save address: ${err?.message || 'Unknown error'}`;
            setPopupMessage(errMsg);
            setPopupOpen(true);
            myProfileProps.handleShowUserMessage?.(errMsg);
        } finally {
            statusBarContext?.setIsLoading?.(false);
            statusBarContext?.setLoadingLabel?.('');
        }
    };

    return (
        <div key={myProfileProps.uniqueName} className='nz-my-profile-container nz-wh-100'>
            <div className='nz-sub-header'>
                <Label
                    uniqueName={`${myProfileProps.uniqueName}-header`}
                    label={headerTitle}
                    fontWeight='600' />
            </div>
            <div className='nz-my-profile-form'>
                <SettingsLibForm
                    id={`${myProfileProps.uniqueName}-profile`}
                    uniqueName={`${myProfileProps.uniqueName}-profile-form`}
                    controls={myProfileControls}
                    profileString={profileString}
                    featureId={myProfileProps.featureId}
                    allowShowHeader={true}
                    allowShowSectionHeader={true}
                    isDisableForm={false}
                    isAddressFormRequired={true}
                    isAutoSave={false}
                    handleSaveForm={handleSaveProfile} />
            </div>
            <YesNoFormContainer
                isOpen={popupOpen}
                uniqueName="my-profile-dialog"
                message={popupMessage}
                showOkButton={true}
                handleYesButtonClick={() => setPopupOpen(false)}
                handleNoButtonClick={() => setPopupOpen(false)}
                handleOkButtonClick={() => setPopupOpen(false)}
            />
        </div>
    )
}

export { MyProfile }
export default MyProfile
