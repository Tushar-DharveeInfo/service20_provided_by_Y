import type { ITicketRecord, TicketId, TicketStatus } from "./ITicket";

function asString(value: unknown, fallback = ""): string {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    return String(value);
}

function asDate(value: unknown): Date {
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === "object" && value !== null && "toDate" in value
        && typeof (value as { toDate: () => Date }).toDate === "function") {
        return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === "object" && value !== null && "seconds" in value
        && typeof (value as { seconds: number }).seconds === "number") {
        return new Date((value as { seconds: number }).seconds * 1000);
    }
    return new Date(String(value ?? ""));
}

/** Maps sample (PascalCase) or Firestore (lowercase) ticket docs onto the tree record shape. */
function FnNormalizeTicket(data: Record<string, unknown>): ITicketRecord {
    return {
        Business: asString(data.Business ?? data.bname),
        Contact: asString(data.Contact ?? data.cname),
        Email: asString(data.Email ?? data.email),
        Subscription: asString(data.Subscription ?? data.subscription),
        Ticket: asString(data.Ticket ?? data.ticketid) as TicketId,
        Mfg: asString(data.Mfg ?? data.mfg),
        EqType: asString(data.EqType ?? data.eqtype),
        ProdNo: asString(data.ProdNo ?? data.prodno),
        MoreInfo: asString(data.MoreInfo ?? data.moreinfo),
        Status: asString(data.Status ?? data.status, "Pending") as TicketStatus,
        DateRequested: asDate(data.DateRequested ?? data.daterequested),
        DateReleased: asDate(data.DateReleased ?? data.datereleased),
        LastUpdated: asDate(data.LastUpdated ?? data.lastupdated),
    };
}

export { FnNormalizeTicket };
