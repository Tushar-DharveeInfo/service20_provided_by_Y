
import { useMemo } from 'react'
import './MyProfile.css'
import { Label } from '../../../shared/basic/label/Label.tsx'
import { SettingsLibForm } from '../../../shared/settingsform/settingslibform/SettingsLibForm.tsx'
import { useMainAppContext } from '../../../shared/context/hooks/MainAppHooks.ts'
import { sampleUserAddress } from './MyProfileSampleData.ts'
import { myProfileControls } from './MyProfileControls.ts'
import { FnBuildMyProfileProfileString } from '../../allcommon/FnBuildMyProfileProfileString.ts'

interface IMyProfile {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;// feature id
    headerText?: string;// header text coming from the selected menu item
    handleShowUserMessage?: (messageText: string) => void;
}

const MyProfile = (myProfileProps: IMyProfile) => {
    const mainAppContext = useMainAppContext();
    const headerTitle = myProfileProps.headerText ?? "My Profile";
    const authUser = mainAppContext.authSession;

    const profileString = useMemo(
        () => (authUser ? FnBuildMyProfileProfileString(authUser, sampleUserAddress) : "[]"),
        [authUser]
    );

    const handleSaveProfile = () => {


        // SAMPLE DATA: EM.AddUpdateTableRecord for the user address is not called.
        myProfileProps.handleShowUserMessage?.("Profile address saved.");
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
        </div>
    )
}

export { MyProfile }
export default MyProfile
