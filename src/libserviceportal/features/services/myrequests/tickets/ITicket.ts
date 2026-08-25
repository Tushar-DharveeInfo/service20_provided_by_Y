export type TicketStatus = 'Accepted' | 'Pending' | 'Need Info' | 'Released';
export type TicketId = `T-${number}`;

interface ITicket {
  Business: string;
  Contact: string;
  Email: string;
  Subscription: string;
  Ticket: TicketId;
  Mfg: string;
  EqType: string;
  ProdNo: string;
  MoreInfo: string;
  Status: TicketStatus;
  DateRequested: Date;
  DateReleased: Date;
  LastUpdated: Date;
}
export type { ITicket as ITicketRecord };
