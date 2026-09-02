import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IServiceData, IServiceSelection } from "../allinterface/IServiceData";
import { useMainAppContext } from "../hooks/MainAppHooks";
import type { ITicketRecord } from "../../../features/services/myrequests/tickets/ITicket";

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
    const [tickets, setTickets] = useState<ITicketRecord[]>([]);
    const [isTicketsLoaded, setIsTicketsLoaded] = useState(false);
    const [isTicketsLoading, setIsTicketsLoading] = useState(false);
    const [ticketsError, setTicketsError] = useState<string | null>(null);

    const selectionKeyRef = useRef(selectionCacheKey(emptySelection()));

    const setBidCid = useCallback((bid?: string, cid?: string) => {
        const nextSelection: IServiceSelection = {
            bid: normalizeId(bid),
            cid: normalizeId(cid),
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
        setBidCid(loggedInUser.tenantNickname, loggedInUser.username);
    }, [mainAppContext.userInfoAndSubscription, setBidCid]);

    const updateTickets = useCallback((records: ITicketRecord[]) => {
        setTickets(records);
        setIsTicketsLoaded(true);
        setIsTicketsLoading(false);
        setTicketsError(null);
    }, []);

    const contextValue = useMemo((): IServiceData => ({
        selection,
        tickets,
        isTicketsLoaded,
        isTicketsLoading,
        ticketsError,
        setBidCid,
        updateTickets,
    }), [
        selection,
        tickets,
        isTicketsLoaded,
        isTicketsLoading,
        ticketsError,
        setBidCid,
        updateTickets,
    ]);

    return (
        <ServiceDataContext.Provider value={contextValue}>
            {children}
        </ServiceDataContext.Provider>
    );
}

export { ServiceDataContext, ServiceDataProvider };
