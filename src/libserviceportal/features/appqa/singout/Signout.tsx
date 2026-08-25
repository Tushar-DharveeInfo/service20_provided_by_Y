
import { useCallback, useEffect, useState } from 'react';
import { getRuntimeConfig, signOut } from "@n20a/libauth";
import { YesNoFormContainer } from '../../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx';
import sampleOpenSessions from '../../../../serviceSampledata/appqa/SignoutSampleData.json';
interface ISignout {
  uniqueName: string;//unique identifier for the control
  handleCloseFailed?: (error: Error) => void; // Optional callback for handling close failures
}
function Signout(signoutprops: ISignout) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openSessions, setOpenSessions] = useState<Record<string, any>[]>();
  const { AUTH_TYPE } = getRuntimeConfig();

  useEffect(() => {
    // API DISABLED: SESSION.GetOpenSession.
    // axiosInterceptor({ url: SESSION.GetOpenSession, ... }, statusBarContext);
    setOpenSessions(sampleOpenSessions);
    setIsOpen(sampleOpenSessions.length > 0);
  }, []);

  const closeSession = async (
    _sessionId: string
  ): Promise<void> => {
    // API DISABLED: SESSION.CloseSession.
    // return axiosInterceptor({ url: SESSION.CloseSession, ... }, statusBarContext);
    await Promise.resolve();
  };

  const handleYesButtonClick = useCallback(async () => {
    if (!openSessions?.length) {
      return;
    }
    try {
      // API DISABLED: skip FnCreateForensiclog for static signout.
      const promises: Promise<void>[] = [];
      for (const session of openSessions) {
        if (session.UserSessionID) {
          promises.push(
            closeSession(session.UserSessionID)
          );
        }
      }

      // Use allSettled to ensure all sessions are attempted even if any one fails
      const results = await Promise.allSettled(promises);

      // Check for any failures and log them
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`Failed to close ${failures.length} of ${results.length} sessions:`, failures);
      }

      // Sign out all browser tabs whose label begins with "NZ-"
      try {
        console.log('Broadcasting signout command to all NZ- tabs');
        const channel = new BroadcastChannel('nz-tab-control');

        // Send the message multiple times with longer intervals to ensure delivery
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            channel.postMessage({ action: 'signout-all-tabs' });
            console.log(`Broadcast sent (attempt ${i + 1})`);
          }, i * 50);
        }

        // Close channel after all messages have been sent
        setTimeout(() => {
          channel.close();
          console.log('Broadcast channel closed');
        }, 600);
      } catch (error) {
        console.warn('Failed to broadcast signout message:', error);
      }

      // Clear session storage and sign out current tab
      window.sessionStorage.removeItem('session_variables');
      signOut(AUTH_TYPE);

      // Close or navigate current tab after giving broadcasts time to reach other tabs
      setTimeout(() => {
        if (document.title.startsWith('NZ-')) {
          console.log('Current tab is NZ- tab, attempting to close');
          window.close();

          // Fallback if this is the last tab and can't be closed
          setTimeout(() => {
            if (!window.closed) {
              console.log('Could not close current tab, navigating to blank page');
              window.location.replace('about:blank');
            }
          }, 500);
        } else {
          console.log('Current tab is not NZ- tab, navigating to home');
          window.location.replace('/');
        }
      }, 700);
    } catch (error) {
      console.error(error);
      signoutprops.handleCloseFailed?.(
        error instanceof Error
          ? error
          : new Error("Failed to close sessions")
      );
    }
  }, [
    openSessions,
    AUTH_TYPE,
    signoutprops
  ]);

  const handleNoButtonClick = useCallback(() => {
    setIsOpen(false);
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.replace("/");
    }
    signoutprops.handleCloseFailed?.(new Error("User cancelled session close"));
  }, [signoutprops]);

  return (
    <>
      {
        isOpen &&
        <YesNoFormContainer
          uniqueName={`${signoutprops.uniqueName}-close-popup`}
          message={
            "Are you sure you want to close all open sessions? \n\n If you select 'Yes', all open Sessions will be closed and all browser tabs will be closed."
          }
          isOpen={isOpen}
          handleYesButtonClick={handleYesButtonClick}
          handleNoButtonClick={handleNoButtonClick}
          dialogTitle="Close Sessions"
        />
      }
    </>
  );
}
export default Signout;
