import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { IAlertProfileItem, IApItem, IEmItem, IFeatureForHelp, IFeatureItem, IMainApp, IRefItem, IUserInfoAndSubscription, IUserProfileRecord } from "../allinterface/IMainApp";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IStatusBar } from "../allinterface/IStatusBar";
import { AuthSession } from "@n20a/libauth";


let featuresData: IFeatureItem[] | null = null;
let deploymentVarData: Record<string, any>[] | null = null;

const getfeaturesData = (): IFeatureItem[] | null => featuresData;
const getDeploymentVars = (): Record<string, any>[] | null => deploymentVarData;

const MainAppContext = createContext<IMainApp | undefined>(undefined);

function MainAppProvider({ children }: IAppContextWrapper) {
    const [apRecords, setApRecords] = useState<IApItem[]>([]);
    const [featureRecords, setFeatureRecords] = useState<IFeatureItem[]>([]);
    const [emRecords, setEmRecords] = useState<IEmItem[]>([]);
    const [alertProfileRecords, setAlertProfileRecords] = useState<IAlertProfileItem[]>([]);
    const [alertRecords, setAlertRecords] = useState<Record<string, any>[]>([]);
    const [refTableRecords, setRefTableRecords] = useState<IRefItem[]>([]);
    const [isInternetAvailable, setIsInternetAvailable] = useState<boolean>(true);
    const [deploymentVars, setDeploymentVars] = useState<Record<string, any>[]>([]);
    const [allFeatureRecords, setAllFeatureRecords] = useState<IFeatureItem[]>([]);
    const [selectedFeatureForHelp, setSelectedFeatureForHelp] = useState<IFeatureForHelp>()
    const [authSession, setAuthSession] = useState<AuthSession>()
    const [userInfoAndSubscription, setUserInfoAndSubscription] = useState<IUserInfoAndSubscription>()

    useEffect(() => {
        try {
            featuresData = featureRecords;
        } catch (error) {
            console.error("Error updating features data:", error);
        }
    }, [featureRecords]);

    useEffect(() => {
        try {
            deploymentVarData = deploymentVars;
        } catch (error) {
            console.error("Error updating deployment vars:", error);
        }
    }, [deploymentVars]);

    useEffect(() => {
        try {
            if (!allFeatureRecords.length) return;

            let filtered = [...allFeatureRecords];

            if (!isInternetAvailable) {
                filtered = filtered.filter(item => !item.Internet);
            }

            setFeatureRecords(filtered);
        } catch (error) {
            console.error("Error filtering feature records:", error);
        }
    }, [isInternetAvailable, allFeatureRecords]);



    const fetchAlertProfileRecords = useCallback((_statusBarContext: IStatusBar) => {
        // SAMPLE DATA: Alert profile API not called.
    }, []);

    const providers = useMemo(
        (): IMainApp => ({
            apRecords,
            setApRecords,
            featureRecords,
            setFeatureRecords,
            allFeatureRecords,
            setAllFeatureRecords,
            emRecords,
            setEmRecords,
            alertProfileRecords,
            setAlertProfileRecords,
            alertRecords,
            setAlertRecords,
            refTableRecords,
            setRefTableRecords,
            isInternetAvailable,
            setIsInternetAvailable,
            authSession,
            setAuthSession,
            userInfoAndSubscription,
            setUserInfoAndSubscription,
            deploymentVars,
            setDeploymentVars,
            selectedFeatureForHelp,
            setSelectedFeatureForHelp,
            fetchAlertProfileRecords,
        }),
        [
            apRecords,
            featureRecords,
            emRecords,
            alertProfileRecords,
            alertRecords,
            refTableRecords,
            isInternetAvailable,
            deploymentVars,
            allFeatureRecords,
            selectedFeatureForHelp,
            authSession,
            userInfoAndSubscription,
            fetchAlertProfileRecords,
        ]
    );

    return (
        <MainAppContext.Provider value={providers}>
            {children}
        </MainAppContext.Provider>
    );
}

export { MainAppContext, MainAppProvider, getfeaturesData, getDeploymentVars };
