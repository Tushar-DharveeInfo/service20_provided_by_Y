import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { IFeatureForHelp, IFeatureItem, IMainApp, IUserAuthSession } from "../allinterface/IMainApp";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { useActivities, useSubs } from "@n20a/libfsdb";
import { IVssDownloadDoc } from "../../../features/services/myrequests/tickets/ICollections";

let featuresData: IFeatureItem[] | null = null;
let deploymentVarData: Record<string, any>[] | null = null;

const getfeaturesData = (): IFeatureItem[] | null => featuresData;
const getDeploymentVars = (): Record<string, any>[] | null => deploymentVarData;

const MainAppContext = createContext<IMainApp | undefined>(undefined);

function MainAppProvider({ children }: IAppContextWrapper) {
    const [featureRecords, setFeatureRecords] = useState<IFeatureItem[]>([]);
    const [deploymentVars, setDeploymentVars] = useState<Record<string, any>[]>([]);
    const [selectedFeatureForHelp, setSelectedFeatureForHelp] = useState<IFeatureForHelp>();
    const [authSession, setAuthSession] = useState<IUserAuthSession>();
    const [distinctProductKeys, setDistinctProductKeys] = useState<string[]>([]);

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

    // Derive bid from authSession for useActivities.
    const bid = String(authSession?.bid ?? "").trim();
    const { createActivity } = useActivities(bid);
    const { createSub } = useSubs(bid);

    /**
     * Writes an activity-log document for the currently signed-in user.
     * All identity fields (bid, cid, displayName, username, email) are read
     * automatically from `authSession` stored in this context — the caller
     * only needs to supply the human-readable `message` string.
     *
     * Usage:
     *   // Login log
     *   await createActivityLog("User logged in");
     *   // Signout log
     *   await createActivityLog("User logged out");
     */
    const createActivityLog = useCallback(async (message: string): Promise<void> => {
        const cid = String(authSession?.cid ?? "").trim();
        if (!bid || !cid || !authSession) {
            // Not enough identity info to write a log — silently skip.
            return;
        }

        const now = new Date().toISOString();

        try {
            const result = await createActivity({
                bid,
                cid,
                activityid: `activity_${cid}_${Date.now()}`,
                message,
                monitorupdated: now,
                monitor: false,
                datecreated: now,
            });
            if (!result) {
                console.error("createActivityLog: createActivity returned null for message:", message);
                return;
            }

            if (!result.success) {
                console.error("createActivityLog failed:", result.error);
            }
        } catch (error) {
            console.error("createActivityLog error:", error);
        }
    }, [authSession, bid, createActivity]);

    const createDownloadDocLog = useCallback(async (downloadDoc: IVssDownloadDoc): Promise<void> => {
        try {
            const result = await createSub(downloadDoc as any);
            if (!result) {
                console.error("createDownloadLog: createDownload returned null for message:", downloadDoc);
                return;
            }

            if (!result.success) {
                console.error("createDownloadLog failed:", result.error);
            }
        } catch (error) {
            console.error("createDownloadLog error:", error);
        }
    }, [createSub]);

    const providers = useMemo(
        (): IMainApp => ({
            featureRecords,
            setFeatureRecords,
            authSession,
            setAuthSession,
            deploymentVars,
            setDeploymentVars,
            selectedFeatureForHelp,
            setSelectedFeatureForHelp,
            createActivityLog,
            createDownloadDocLog,
            distinctProductKeys,
            setDistinctProductKeys,
        }),
        [
            featureRecords,
            authSession,
            deploymentVars,
            selectedFeatureForHelp,
            createActivityLog,
            createDownloadDocLog,
            distinctProductKeys,
        ]
    );

    return (
        <MainAppContext.Provider value={providers}>
            {children}
        </MainAppContext.Provider>
    );
}

export { MainAppContext, MainAppProvider, getfeaturesData, getDeploymentVars };
