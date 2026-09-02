import type { ITicketRecord } from "../../../features/services/myrequests/tickets/ITicket";

/** Logged-in service user scope used as the ticket cache key. */
interface IServiceSelection {
    bid?: string;
    cid?: string;
}

interface IServiceData {
    selection: IServiceSelection;
    tickets: ITicketRecord[];
    isTicketsLoaded: boolean;
    isTicketsLoading: boolean;
    ticketsError: string | null;
    /** Store ticket bid/cid. Reloads tickets when they change. */
    setBidCid: (bid?: string, cid?: string) => void;
    /** Always read/write through the session ticket cache. */
    updateTickets: (tickets: ITicketRecord[]) => void;
}

export type { IServiceData, IServiceSelection };
