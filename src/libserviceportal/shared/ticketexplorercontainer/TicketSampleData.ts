/*
 * SAMPLE DATA: tickets from sampletickets.json for ticket explorer.
 */
import sampleTicketsJson from '../../../serviceSampledata/ticket/sampletickets.json'
import type { ITicket, TicketId, TicketStatus } from '../allinterface/tree/ITicket'

type ITicketJson = {
    Business: string
    contact: string
    Email: string
    subscription: string
    Ticket: string
    Mfg: string
    EqType: string
    ProdNo: string
    MoreInfo: string
    Status: string
    dateRequested: string
    dateReleased: string
    LastUpdated: string
}

const sampleTickets: ITicket[] = (sampleTicketsJson as ITicketJson[]).map((row) => ({
    Business: row.Business,
    contact: row.contact,
    Email: row.Email,
    subscription: row.subscription,
    Ticket: row.Ticket as TicketId,
    Mfg: row.Mfg,
    EqType: row.EqType,
    ProdNo: row.ProdNo,
    MoreInfo: row.MoreInfo,
    Status: row.Status as TicketStatus,
    dateRequested: new Date(row.dateRequested),
    dateReleased: new Date(row.dateReleased),
    LastUpdated: new Date(row.LastUpdated),
}))

export { sampleTickets }
export type { ITicket }
