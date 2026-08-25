
import '@n20a/libauth/style.css'
import { useEffect, useRef, useState } from 'react';
import { AppAuthRoot, AuthSession, getRuntimeConfig } from '@n20a/libauth';

interface IAuthentication {
    uniqueName: string;
    onSuccess: (userData: AuthSession) => void;
}

const Authentication = (authenticationProps: IAuthentication) => {
    const [authenticatedUser, setAuthenticatedUser] = useState<AuthSession | null>(null);
    const scheduledRef = useRef(false);
    const { AUTH_TYPE } = getRuntimeConfig();

    useEffect(() => {
        if (authenticatedUser) {
            authenticationProps.onSuccess(authenticatedUser);
        }
    }, [authenticatedUser, authenticationProps]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }} key={authenticationProps.uniqueName}>
            <AppAuthRoot
                authType={AUTH_TYPE}
                onAuthenticated={(user: AuthSession) => {
                    console.log('authenticatedUser', JSON.stringify(user))
                    if (scheduledRef.current) return;
                    scheduledRef.current = true;

                    queueMicrotask(() => {
                        setAuthenticatedUser(user);
                    });
                }}
            />
        </div>
    );
};

export { Authentication };
