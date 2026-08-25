
import { Label } from '../../../shared/basic/label/Label.tsx'
import '../../allcss/profile/MyActivities.css'
import { ForensicLog } from './forensiclog/ForensicLog.tsx';

interface IMyActivities {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;// feature id
    headerText?: string;// header text coming from the selected menu item
    allowSort?: boolean;// allow grid column sort, defaults to true
    handleShowUserMessage?: (messageText: string) => void;
}
/* Profile/MyActivities is the forensic log scoped to the logged in user,
   so it reuses the same ForensicLog the sidebar renders with loginType "user". */
const MyActivities = (myActivitiesProps: IMyActivities) => {
    const headerTitle = myActivitiesProps.headerText ?? "My Activities";

    return (
        <div key={myActivitiesProps.uniqueName} className='nz-my-activities-container nz-wh-100'>
            <div className='nz-sub-header'>
                <Label
                    uniqueName={`${myActivitiesProps.uniqueName}-header`}
                    label={headerTitle}
                    fontWeight='600' />
            </div>
            <div className='nz-my-activities-content'>
                <ForensicLog
                    uniqueName={`${myActivitiesProps.uniqueName}-forensic-log`}
                    featureId={myActivitiesProps.featureId}
                    isSetting={true}
                    loginType={'user'}
                    allowSort={myActivitiesProps.allowSort ?? true}
                    handleShowUserMessage={myActivitiesProps.handleShowUserMessage} />
            </div>
        </div>
    )
}

export { MyActivities }
export default MyActivities
