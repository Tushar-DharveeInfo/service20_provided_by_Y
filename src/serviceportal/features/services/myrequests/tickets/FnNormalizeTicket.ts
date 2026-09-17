import type { ITicketDoc } from '@n20a/libfsdb';

function asString(value: unknown, fallback = ""): string {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    return String(value);
}

function asDateStr(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object" && value !== null && "toDate" in value
        && typeof (value as { toDate: () => Date }).toDate === "function") {
        return (value as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof value === "object" && value !== null && "seconds" in value
        && typeof (value as { seconds: number }).seconds === "number") {
        return new Date((value as { seconds: number }).seconds * 1000).toISOString();
    }
    return String(value);
}

/** Maps Firestore (lowercase) ticket docs onto ITicketDoc from @n20a/libfsdb. */
function FnNormalizeTicket(data: Record<string, unknown>): ITicketDoc {
    return {
        bid: asString(data.bid ?? data.Business),
        cid: asString(data.cid ?? data.Contact),
        monitor: Boolean(data.monitor ?? false),
        monitorupdated: asDateStr(data.monitorupdated ?? data.LastUpdated),
        ticketid: asString(data.ticketid ?? data.Ticket ?? data.id),
        tickettype: asString(data.tickettype ?? data.ticketType ?? data.NotesType ?? ''),
        subscription: asString(data.subscription ?? data.Subscription),
        mfg: asString(data.mfg ?? data.Mfg),
        eqtype: asString(data.eqtype ?? data.EqType ?? data.NodeType),
        prodno: asString(data.prodno ?? data.ProdNo ?? data.FileUID),
        moreinfo: asString(data.moreinfo ?? data.MoreInfo ?? data.NotesMAX ?? data.message),
        status: asString(data.status ?? data.Status, "Pending"),
        daterequested: asDateStr(data.daterequested ?? data.DateRequested ?? data.datecreated ?? data.dateCreated),
        datereleased: asDateStr(data.datereleased ?? data.DateReleased),
        lastupdated: asDateStr(data.lastupdated ?? data.LastUpdated ?? data.monitorupdated),
    };
}

export { FnNormalizeTicket };
