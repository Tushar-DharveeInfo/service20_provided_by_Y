import type {
    IUserAuthSession,
    IUserSubscription,
} from "../../shared/context/allinterface/IMainApp";

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

/* Resolves display name from the signed-in IUserAuthSession. */
const FnGetAuthDisplayName = (authSession?: IUserAuthSession | null): string => {
    if (!authSession) {
        return "";
    }
    return (authSession.displayName || authSession.username || authSession.email || "").trim();
};

/*
 * Builds the status-bar login identity line from IUserAuthSession + subscription.
 * Example: "You are logged in as Jane Doe NetZoom. bid=bid_103. cid=cid_bid_103_1"
 */
const FnGetLoggedInStatusMessage = (
    authSession?: IUserAuthSession | null,
    licenses?: IUserSubscription[],
): string => {
    const displayName = FnGetAuthDisplayName(authSession);
    const subscriberProduct = FnGetSubscriberProduct(licenses);
    const bid = String(authSession?.bid ?? "").trim();
    const cid = String(authSession?.cid ?? "").trim();

    let identity = "You are logged in as a guest user";
    if (displayName && subscriberProduct) {
        identity = `You are logged in as ${displayName} ${subscriberProduct}`;
    } else if (displayName) {
        identity = `You are logged in as ${displayName}`;
    } else if (subscriberProduct) {
        identity = `You are logged in as a ${subscriberProduct}`;
    } else if (!authSession) {
        identity = "You are logged in as a guest user";
    }

    const scopeParts: string[] = [];
    if (bid) scopeParts.push(`bid=${bid}`);
    if (cid) scopeParts.push(`cid=${cid}`);
    if (!scopeParts.length) {
        return identity;
    }
    return `${identity}. ${scopeParts.join(". ")}`;
};

export { FnGetLoggedInStatusMessage, FnGetAuthDisplayName, FnGetSubscriberProduct };
export type { TSubscriberProduct };
