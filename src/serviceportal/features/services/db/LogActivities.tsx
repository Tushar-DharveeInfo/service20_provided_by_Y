import {useEffect} from 'react'
import { useActivities, useBusinessTickets } from '@n20a/libfsdb'


const {loading: activitiesLoading, error: activitiesError,  activities, getActivities, createActivity } = useActivities('b-100');

function LogActivitiesComponent({ activityData }: { activityData: any }) {
    useEffect(() => {
      createActivity(activityData);
    }, []);

    return (
        <div>
          {activitiesLoading && <p>Logging...</p>}
          {activitiesError && <p>Error: {activitiesError}</p>}
        </div>
    )
}

function getLoggedActivities() {

  useEffect(() => {
    getActivities();
  }, []);

  return (
    <div>
      {!activitiesLoading && !activitiesError &&  
        (activities ?? []).map((activity: any) => (
          <p key={activity.id}>{activity.description}</p>
        ))
      }
      {activitiesLoading && <p>Logging...</p>}
      {activitiesError && <p>Error: {activitiesError}</p>}
    </div>
  );
}

export {getLoggedActivities, LogActivitiesComponent}
