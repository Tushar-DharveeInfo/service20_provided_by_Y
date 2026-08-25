export type TicketStatus = "Accepted" | "Pending" | "Need Info" | "Released";
export type TicketId = `T-${number}`;

export interface ITicket {
  Business: string;
  contact: string;
  Email: string;
  subscription: string;
  Ticket: TicketId;
  Mfg: string;
  EqType: string;
  ProdNo: string;
  MoreInfo: string;
  Status: TicketStatus;
  dateRequested: Date;
  dateReleased: Date;
  LastUpdated: Date;
}

export type { ITicket as ITicketRecord };
