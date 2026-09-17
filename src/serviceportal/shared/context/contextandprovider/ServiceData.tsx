import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBusinessTickets, type ITicketDoc } from "@n20a/libfsdb";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IServiceData, IServiceSelection, ITicketFilterValues } from "../allinterface/IServiceData";
import { useMainAppContext } from "../hooks/MainAppHooks";
import { FnNormalizeTicket } from "../../../features/services/myrequests/tickets/FnNormalizeTicket";
import {useLoadRemoteJson, type IUseLoadRemoteJsonOptions } from "../../allcommon/LoadRemoteJsonHooks";

const DEFAULT_TICKET_FILTER: ITicketFilterValues = {
    showAll: true,
    byMfg: true,
};

const FILTER_OP = "==" as const;

interface IEqidVsStencil {
    EQID: string;
    StencilName: string;
}

type IEqidVsStencils = IEqidVsStencil[];

function normalizeEqidVsStencils(value: unknown): IEqidVsStencils {
    if (Array.isArray(value)) {
        return value as IEqidVsStencils;
    }
    if (value && typeof value === "object") {
        const maybeEqidVsStencil = (value as { EQIDvsStencil?: unknown }).EQIDvsStencil;
        if (Array.isArray(maybeEqidVsStencil)) {
            return maybeEqidVsStencil as IEqidVsStencils;
        }
        const maybeRows = (value as { rows?: unknown }).rows;
        if (Array.isArray(maybeRows)) {
            return maybeRows as IEqidVsStencils;
        }
    }
    return [];
}

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

// function emptySelection(): IServiceSelection {
//     return {};
// }

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

    const [selection, setSelection] = useState<IServiceSelection>({});
    const [filterJson, setFilterJson] = useState<string>(
        toFilterJsonString(DEFAULT_TICKET_FILTER)
    );
    const [tickets, setTickets] = useState<ITicketDoc[]>([]);
    const [isTicketsLoaded, setIsTicketsLoaded] = useState(false);
    const [isTicketsLoading, setIsTicketsLoading] = useState(false);
    const [ticketsError, setTicketsError] = useState<string | null>(null);

////////////////////////////////////////////load eqid vs stencils
    const [eqidVsStencils, setEqidVsStencils] = useState<IEqidVsStencils>([]);
    const [eqidVsStencilsError, setEqidVsStencilsError] = useState<string | null>(null);

    const options: IUseLoadRemoteJsonOptions<IEqidVsStencils> = {
        // specify the options here
        bucket: "n20-bucket-01",
        baseFolder: "vssfolder-01",
        fileName: "eqidvsstencil.json",
        onSuccess: (data) => {
            setEqidVsStencils(normalizeEqidVsStencils(data));
            setEqidVsStencilsError(null);
        },
        onError: (message) => {
            setEqidVsStencilsError(message);
            console.error("Failed to load eqidvsstencil.json:", message);
        }
    };

    useLoadRemoteJson(options);
//////////////////////////////////////////////////////////////
    const bid = mainAppContext.authSession?.bid ?? "";
    const cid = mainAppContext.authSession?.cid ?? "";
// console.log("Y-in ServiceDataProvider - Retrieved from authSession - Current bid:", bid, "cid:", cid);

    const { getTickets } = useBusinessTickets(bid);

    const selectionKeyRef = useRef(selectionCacheKey({}));

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

        setBidCid(mainAppContext.authSession?.bid, mainAppContext.authSession?.cid);
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

    const getStencilName = useCallback((EQID: string): string | null => {
    //   console.log("Y-ServiceData: Getting stencil name for EQID:", EQID);
        try 
        {
          if (!EQID || !Array.isArray(eqidVsStencils) || eqidVsStencils.length == 0) 
          {
            return null;
          }
          const match = eqidVsStencils.find((item) => item.EQID === EQID);
          return match?.StencilName ?? null;
        } 
        catch (error) 
        {
          console.log("Y-ServiceData: Error occurred while getting stencil name for EQID:", EQID, "Error:", error);
          
          return null;
        }
    }, [eqidVsStencils]);

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
        getStencilName,
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
        getStencilName,
    ]);

    return (
        <ServiceDataContext.Provider value={contextValue}>
            {children}
        </ServiceDataContext.Provider>
    );
}

export { ServiceDataContext, ServiceDataProvider };
