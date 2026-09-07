import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBusinessTickets, type ITicketDoc } from "@n20a/libfsdb";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IServiceData, IServiceSelection, ITicketFilterValues } from "../allinterface/IServiceData";
import { useMainAppContext } from "../hooks/MainAppHooks";
import { FnNormalizeTicket } from "../../../features/services/myrequests/tickets/FnNormalizeTicket";

const DEFAULT_TICKET_FILTER: ITicketFilterValues = {
    showAll: true,
    byMfg: true,
};

const FILTER_OP = "==" as const;

function toFilterJsonString(values: ITicketFilterValues): string {
    return JSON.stringify(
        Object.entries(values).map(([field, value]) => ({
            field,
            op: FILTER_OP,
            value: String(value),
        }))
    );
}

const ServiceDataContext = createContext<IServiceData | undefined>(undefined);

function emptySelection(): IServiceSelection {
    return {};
}

function selectionCacheKey(selection: IServiceSelection): string {
    return JSON.stringify({
        bid: selection.bid ?? "",
        cid: selection.cid ?? "",
    });
}

function normalizeId(value: unknown): string | undefined {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    const text = String(value).trim();
    return text || undefined;
}

function ServiceDataProvider({ children }: IAppContextWrapper) {
    const mainAppContext = useMainAppContext();

    const [selection, setSelection] = useState<IServiceSelection>(emptySelection);
    const [filterJson, setFilterJson] = useState<string>(
        toFilterJsonString(DEFAULT_TICKET_FILTER)
    );
    const [tickets, setTickets] = useState<ITicketDoc[]>([]);
    const [isTicketsLoaded, setIsTicketsLoaded] = useState(false);
    const [isTicketsLoading, setIsTicketsLoading] = useState(false);
    const [ticketsError, setTicketsError] = useState<string | null>(null);

    const bid = selection.bid ?? "";
    const cid = selection.cid;
    const { getTickets } = useBusinessTickets(bid);

    const selectionKeyRef = useRef(selectionCacheKey(emptySelection()));

    const setBidCid = useCallback((nextBid?: string, nextCid?: string) => {
        const nextSelection: IServiceSelection = {
            bid: normalizeId(nextBid),
            cid: normalizeId(nextCid),
        };
        const nextKey = selectionCacheKey(nextSelection);
        if (nextKey === selectionKeyRef.current) {
            return;
        }
        selectionKeyRef.current = nextKey;
        setSelection(nextSelection);
        setIsTicketsLoaded(false);
        setIsTicketsLoading(false);
        setTickets([]);
        setTicketsError(null);
    }, []);

    useEffect(() => {
        const loggedInUser = mainAppContext.userInfoAndSubscription?.userInfo;
        if (!loggedInUser) {
            return;
        }
        setBidCid(loggedInUser.bid, loggedInUser.cid);
    }, [mainAppContext.userInfoAndSubscription, setBidCid]);

    useEffect(() => {
        if (!bid) {
            if (mainAppContext.userInfoAndSubscription?.userInfo) {
                setTickets([]);
                setTicketsError(null);
                setIsTicketsLoaded(true);
                setIsTicketsLoading(false);
            }
            return;
        }

        let cancelled = false;
        setIsTicketsLoading(true);
        setIsTicketsLoaded(false);
        setTicketsError(null);

        const filters = cid
            ? [{ field: "cid", op: "==" as const, value: cid }]
            : undefined;

        void getTickets(filters).then((rows) => {
            if (cancelled) {
                return;
            }
            if (rows == null) {
                setTickets([]);
                setTicketsError("Failed to load tickets");
            } else {
                setTickets(rows.map((row) => FnNormalizeTicket(row)));
                setTicketsError(null);
            }
            setIsTicketsLoaded(true);
            setIsTicketsLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [bid, cid, getTickets, mainAppContext.userInfoAndSubscription]);

    const updateTickets = useCallback((records: ITicketDoc[]) => {
        setTickets(records);
        setIsTicketsLoaded(true);
        setIsTicketsLoading(false);
        setTicketsError(null);
    }, []);

    const setFilterJsonValue = useCallback((nextFilterJson: ITicketFilterValues) => {
        const appliedFilterJson = toFilterJsonString(nextFilterJson ?? DEFAULT_TICKET_FILTER);
        setFilterJson((prev) => (prev === appliedFilterJson ? prev : appliedFilterJson));
    }, []);

    const contextValue = useMemo((): IServiceData => ({
        selection,
        tickets,
        isTicketsLoaded,
        isTicketsLoading,
        ticketsError,
        filterJson,
        setBidCid,
        setFilterJson: setFilterJsonValue,
        updateTickets,
    }), [
        selection,
        tickets,
        isTicketsLoaded,
        isTicketsLoading,
        ticketsError,
        filterJson,
        setBidCid,
        setFilterJsonValue,
        updateTickets,
    ]);

    return (
        <ServiceDataContext.Provider value={contextValue}>
            {children}
        </ServiceDataContext.Provider>
    );
}

export { ServiceDataContext, ServiceDataProvider };
