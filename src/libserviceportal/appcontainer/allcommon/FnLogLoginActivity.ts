import type { IFirestoreWriteResult } from "@n20a/libfsdb";
import type { IUserInfo } from "../../shared/context/allinterface/IMainApp";

const loggedLoginActivityKeys = new Set<string>();

type TCreateActivity = (activity: Record<string, unknown>) => Promise<IFirestoreWriteResult | null>;
type TUserActivityKind = "login" | "signout";

interface ILogUserActivityParams {
    createActivity: TCreateActivity;
    userInfo?: IUserInfo;
    bid: string;
}

function buildUserActivityMessage(
    kind: TUserActivityKind,
    userInfo: IUserInfo,
    bid: string,
    cid: string
): string {
    const displayName = String(userInfo.displayName ?? "").trim();
    const email = String(userInfo.email ?? "").trim();
    const username = String(userInfo.username ?? "").trim();
    const parts = [kind === "login" ? "User logged in" : "User logged out"];
    if (displayName) parts.push(`name=${displayName}`);
    if (username) parts.push(`username=${username}`);
    if (email) parts.push(`email=${email}`);
    if (bid) parts.push(`bid=${bid}`);
    if (cid) parts.push(`cid=${cid}`);
    return parts.join(". ");
}

async function writeUserActivity(
    kind: TUserActivityKind,
    { createActivity, userInfo, bid }: ILogUserActivityParams
): Promise<void> {
    const cid = String(userInfo?.cid ?? "").trim();
    if (!bid || !cid || !userInfo) {
        return;
    }

    const now = new Date().toISOString();
    const message = buildUserActivityMessage(kind, userInfo, bid, cid);

    try {
        const result = await createActivity({
            bid,
            cid,
            monitorupdated: now,
            monitor: false,
            activityid: `${kind}_${cid}_${Date.now()}`,
            message,
            datecreated: now,
        });

        if (!result) {
            console.error(`${kind} activity log failed: createActivity returned null`);
            return;
        }

        if (!result.success) {
            console.error(`${kind} activity log failed:`, result.error);
        }
    } catch (error) {
        console.error(`${kind} activity log failed:`, error);
    }
}

/** Writes one activity document when the signed-in user session is ready. */
const FnLogLoginActivity = async (params: ILogUserActivityParams): Promise<void> => {
    const cid = String(params.userInfo?.cid ?? "").trim();
    if (!params.bid || !cid) {
        return;
    }

    const key = `${params.bid}:${cid}`;
    if (loggedLoginActivityKeys.has(key)) {
        return;
    }
    loggedLoginActivityKeys.add(key);
    await writeUserActivity("login", params);
};

/** Writes one activity document when the user confirms sign out. */
const FnLogSignoutActivity = async (params: ILogUserActivityParams): Promise<void> => {
    await writeUserActivity("signout", params);
};

export { FnLogLoginActivity, FnLogSignoutActivity };
export type { ILogUserActivityParams as ILogLoginActivityParams };
