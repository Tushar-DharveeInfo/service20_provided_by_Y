import type {
    IUserInfoAndSubscription,
    IUserProfileRecord,
    IUserSubscription,
} from "../../shared/context/allinterface/IMainApp";
import type { AuthSession } from "@n20a/libauth";

type TSubscriberProduct = "NetZoom" | "Visio Stencils" | string;

/* Prefer an active NetZoom license product name for the status-bar label. */
const FnGetSubscriberProduct = (
    licenses?: IUserSubscription[]
): TSubscriberProduct | undefined => {
    if (!licenses?.length) {
        return undefined;
    }

    const now = Date.now();
    const isActive = (license: IUserSubscription): boolean => {
        const end = Date.parse(license.EndDate);
        return Number.isNaN(end) || end >= now;
    };

    const active = licenses.filter(isActive);
    const candidates = active.length ? active : licenses;

    const netZoom = candidates.find((item) =>
        item.ProductName?.toLowerCase().includes("netzoom")
        && !item.ProductName?.toLowerCase().includes("readonly")
        && !item.ProductName?.toLowerCase().includes("colo")
    );
    if (netZoom?.ProductName) {
        return "NetZoom";
    }

    const first = candidates[0]?.ProductName?.trim();
    return first || undefined;
};

/* Resolves display name from auth session (Authentication user object). */
const FnGetAuthDisplayName = (authSession?: AuthSession | null): string => {
    if (!authSession) {
        return "";
    }
    return (authSession.displayName || authSession.username || authSession.email || "").trim();
};

/*
 * Builds the status-bar login identity line from auth user name + subscription.
 * Example: "You are logged in as Jane Doe as a NetZoom subscriber"
 */
const FnGetLoggedInStatusMessage = (
    userInfoAndSubscription?: IUserInfoAndSubscription,
    authSession?: AuthSession | null,
): string => {
    const displayName =
        authSession?.displayName ||
        userInfoAndSubscription?.userInfo.displayName?.trim()


    const subscriberProduct = FnGetSubscriberProduct(userInfoAndSubscription?.subscription);

    if (!displayName && !subscriberProduct && !authSession) {
        return "You are logged in as a guest user";
    }

    if (!subscriberProduct) {
        return displayName
            ? `You are logged in as ${displayName}`
            : "You are logged in as a guest user";
    }

    if (displayName) {
        return `You are logged in as ${displayName} ${subscriberProduct}`;
    }

    return `You are logged in as a ${subscriberProduct}`;
};

export { FnGetLoggedInStatusMessage, FnGetAuthDisplayName, FnGetSubscriberProduct };
export type { TSubscriberProduct };
