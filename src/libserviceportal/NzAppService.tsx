import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, DefaultTheme } from 'styled-components';
import { ModuleRegistry as GridModuleRegistry, AllCommunityModule as GridAllCommunityModule } from 'ag-grid-community';
import './NzAppService.css';
import themes from './shared/theme-provider.json';
import { useSessionContext } from './shared/context/hooks/SessionHooks';
import { useMainAppContext } from './shared/context/hooks/MainAppHooks';
import { AppContextWrapper } from './shared/context/AppContextWrapper';
import { NodeHeight, SubMenuHeight } from './appcontainer/alldefaultprops/DefaultPropsAppContainer';
import { GlobalStyles } from './features/appqa/theme/GlobalStyles';

import { IDeploymentEnv, IDeploymentEnvResponse } from './shared/allinterface/IApiResponse';
import { AppContainer } from './appcontainer/AppContainer';
import sampleDeploymentEnvResponse from '../serviceSampledata/auth/DeploymentEnvSampleData.json';
import authSampleData from '../serviceSampledata/auth/AuthorizationSampleData.json';
import sampleUserLicenses from '../serviceSampledata/auth/MySubscriptionsSampleData.json';

const { sampleSessionId, sampleSessionVariables } = authSampleData;

import type { IFeatureItem, IUserInfoAndSubscription } from './shared/context/allinterface/IMainApp';
import { FnGetAuthDisplayName } from './appcontainer/allcommon/FnGetLoggedInStatusMessage';

import { FirestoreProvider, CloudStorageProvider, type ICloudStorageDeps } from '@n20a/libfsdb'
import type { IAxiosInterceptorDeps } from '@n20a/libaxios'
import { AuthSession, getFirebaseServices } from '@n20a/libauth'


GridModuleRegistry.registerModules([GridAllCommunityModule]);

interface INzApp {
    uniqueName: string;
    user: AuthSession;
    fbToken?: string | null;
    onSuccess: () => void;
    onError: (error: string) => void;
}


function isDeploymentEnvResponse(response: unknown): response is IDeploymentEnvResponse {
    return (
        typeof response === "object"
        && response !== null
        && "valid" in response
        && "env" in response
        && Array.isArray((response as { env: unknown }).env)
    );
}

const fnFormatFeature = (record: Record<string, any>) => {

    const toFeatureId = (value: string | number | undefined): string =>
        value === undefined || value === null ? "" : String(value);
    const toBool = (value: string | boolean | undefined, defaultValue = false): boolean => {
        if (typeof value === "boolean") return value;
        if (value === "1" || value === "true") return true;
        if (value === "0" || value === "false") return false;
        return defaultValue;
    };
    const featureId = toFeatureId(record._Feature ?? record.Feature);
    const menuId = toFeatureId(record.MenuID ?? featureId);

    return {
        ...record,
        EntityName: record.EntityName ?? "Feature",
        MenuID: menuId,
        _Feature: featureId,
        Label: record.Label ?? "",
        Tooltip: record.Tooltip ?? "",
        SortOrder: record.SortOrder,
        DefaultQA: toBool(record.DefaultQA),
        Secured: toBool(record.Secured),
        NodeType: record.NodeType ?? "",
        FeatureTag: record.FeatureTag ?? "",
        FilterForm: record.FilterForm ?? "",
        SearchPrompt: record.SearchPrompt ?? null,
        IsNZ: toBool(record.IsNZ, true),
        // serviceFeature.json often omits EntID; empty EntID makes every menu group match as "selected" and open.
        EntID: record.EntID ? String(record.EntID) : featureId,
        RecID: record.RecID ? String(record.RecID) : featureId,
        LastUpdated: record.LastUpdated ?? "",
    };
}

function NzLoadContextAndVariables({ uniqueName, user, fbToken, onError, onSuccess }: INzApp) {
    // console.log('NzAppService received user:', user);

    const [selectedTheme, setSelectedTheme] = useState<DefaultTheme>(themes.data.light);
    const [isSessionCreated, setIsSessionCreated] = useState(false);
    const [isDeploymentVarsLoaded, setIsDeploymentVarsLoaded] = useState(false);

    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();

    const reportFatalError = useCallback(
        (message: string, err?: unknown) => {
            console.error("NzAppService fatal error:", message, err);
            onError?.(message);
        },
        [onError]
    );

    useEffect(() => {
        const loadDeploymentVars = async () => {
            try {
                const appConfig: IDeploymentEnv[] = Object.entries(window.APP_CONFIG ?? {}).map(
                    ([key, value]) => ({
                        key,
                        value: String(value)
                    })
                );

                // SAMPLE DATA: expapi /deployment/env not called
                const apiResponse = sampleDeploymentEnvResponse;

                if (!isDeploymentEnvResponse(apiResponse)) {
                    throw new Error("Invalid environment response.");
                }

                const { valid, env } = apiResponse;
                if (!valid) {
                    throw new Error("Invalid environment response.");
                }
                if (env.length === 0) {
                    throw new Error("Environment configuration not found.");
                }

                const mergedEnv = [
                    ...env,
                    ...appConfig.filter(
                        appItem => !env.some(apiItem => apiItem.key === appItem.key)
                    )
                ];

                mainAppContext.setDeploymentVars(mergedEnv);
                setIsDeploymentVarsLoaded(true);
            } catch (error) {
                reportFatalError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load environment configuration."
                );
                setIsDeploymentVarsLoaded(false);
                setIsSessionCreated(false);
            }
        };

        void loadDeploymentVars();
    }, []);

    useEffect(() => {
        if (!isDeploymentVarsLoaded) return;

        const isMountedRef = { current: true };

        const initializeData = async () => {
            if (!sampleSessionVariables.length || !sampleSessionId) return;
            if (!isMountedRef.current) return;

            let featureRecords: IFeatureItem[] = [];
            try {
                const response = await fetch('/serviceFeature.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch /serviceFeature.json: ${response.status}`);
                }
                const rawFeatures = await response.json();
                if (Array.isArray(rawFeatures)) {
                    featureRecords = rawFeatures.map(fnFormatFeature) as IFeatureItem[];
                } else {
                    throw new Error("serviceFeature.json is not an array");
                }
            } catch (err) {
                console.error("Error loading serviceFeature.json:", err);
                reportFatalError("Failed to load features from serviceFeature.json");
                return;
            }

            if (!featureRecords.length) {
                reportFatalError("Features table is empty");
                return;
            }

            mainAppContext.setFeatureRecords(featureRecords);
            mainAppContext.setAllFeatureRecords(featureRecords);

            mainAppContext.setAuthSession(user);

            const displayName = FnGetAuthDisplayName(user);
            const userInfoAndSubscription: IUserInfoAndSubscription = {
                userInfo: {
                    displayName: displayName || "User",
                    username: user?.username ?? "",
                    email: user?.email as string,
                    tenantNickname: user?.tenantNickname as string,
                },
                subscription: sampleUserLicenses,
            };
            mainAppContext.setUserInfoAndSubscription(userInfoAndSubscription);

            sessionContext.setSessionList(sampleSessionVariables);
            setIsSessionCreated(true);

            try {
                onSuccess();
            } catch (error) {
                console.error("Error in onSuccess callback:", error);
            }
        };

        void initializeData();

        const root = document.documentElement;
        root.style.setProperty("--node_height", NodeHeight);
        root.style.setProperty("--submenu_height", SubMenuHeight);

        return () => {
            isMountedRef.current = false;
        };
    }, [isDeploymentVarsLoaded]);

    const handleThemeChange = useCallback((theme: unknown) => {
        if (typeof theme !== 'object' || theme === null || !('name' in theme)) {
            console.error('Invalid theme object');
            return;
        }

        const typedTheme = theme as DefaultTheme & { name: string };
        sessionStorage.setItem("selected_theme", typedTheme.name);
        setSelectedTheme(typedTheme);
    }, []);

    return (
        <ThemeProvider theme={selectedTheme}>
            <GlobalStyles />
            {isSessionCreated && isDeploymentVarsLoaded && (
                <AppContainer
                    isNewSession={true}
                    uniqueName={uniqueName}
                    handleThemeChange={handleThemeChange}
                />
            )}
        </ThemeProvider>
    );
}

function NzAppService(props: INzApp) {
    const [firebaseToken, setFirebaseToken] = useState<string | null>(null);

    useEffect(() => {
        const { auth } = getFirebaseServices();
        // onAuthStateChanged fires once auth state is restored from persistence
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            const token = user ? await user.getIdToken() : null;
            // console.warn('Yadav-firebaseToken:', token ? `${token.substring(0, 30)}...` : 'NULL - not signed in');
            setFirebaseToken(token);
        });
        return unsubscribe;
    }, []);

    const cfg = (window as Window & { APP_CONFIG?: Record<string, string> }).APP_CONFIG ?? {};

    const firestoreDeps = useMemo<IAxiosInterceptorDeps>(() => ({
        getBaseApiUrl: () => cfg.CLOUDRUN_URL || (import.meta.env.DEV ? 'http://localhost:8080' : ''),
        getSessionId: () => {
            const header = firebaseToken ? `Bearer ${firebaseToken}` : null;
            // console.warn('Yadav-getSessionId called, header:', header ? header.substring(0, 40) + '...' : 'NULL');
            return header;
        },
        sessionHeaderName: 'Authorization',
        defaultTimeoutMs: 30000,
    }), [firebaseToken]);

    const cloudStorageDeps = useMemo<ICloudStorageDeps>(() => ({
        getBaseApiUrl: () => cfg.CLOUDRUN_URL || (import.meta.env.DEV ? 'http://localhost:8080' : ''),
        getValidationCode: () => cfg.VALIDATION_CODE ?? '',
    }), []);
    if (!firebaseToken) return null;

    return (
        <AppContextWrapper>
            <FirestoreProvider deps={firestoreDeps}>
                <CloudStorageProvider deps={cloudStorageDeps}>
                    <Router>
                        <NzLoadContextAndVariables {...props} />
                    </Router>
                </CloudStorageProvider>
            </FirestoreProvider>
        </AppContextWrapper>
    );
}

export default NzAppService
