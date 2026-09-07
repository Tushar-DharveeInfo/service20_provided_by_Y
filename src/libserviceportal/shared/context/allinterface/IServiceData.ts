import type { ITicketDoc } from '@n20a/libfsdb';

/** Applied filter json stored on service context (keys/values from the active filter form). */
interface ITicketFilterValues {
    /** When true show all tickets; when false show Pending only. */
    showAll: boolean
    /** When true: Mfg → ProdNo. When false: DateRequested → Mfg → ProdNo. */
    byMfg: boolean
}

/** Logged-in service user scope used as the ticket cache key. */
interface IServiceSelection {
    bid?: string;
    cid?: string;
}

interface IServiceData {
    selection: IServiceSelection;
    tickets: ITicketDoc[];
    isTicketsLoaded: boolean;
    isTicketsLoading: boolean;
    ticketsError: string | null;
    /** Applied filter json string, e.g. '[{"field":"showAll","op":"==","value":"true"}]'. */
    filterJson: string;
    /** Store ticket bid/cid. Reloads tickets when they change. */
    setBidCid: (bid?: string, cid?: string) => void;
    /** Convert filter key/values to json string and store when the value changes. */
    setFilterJson: (filterJson: ITicketFilterValues) => void;
    /** Always read/write through the session ticket cache. */
    updateTickets: (tickets: ITicketDoc[]) => void;
}

export type { IServiceData, ITicketFilterValues, IServiceSelection };
