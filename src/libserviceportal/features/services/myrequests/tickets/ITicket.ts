export type TicketStatus = 'Accepted' | 'Pending' | 'Need Info' | 'Released';
export type TicketId = `T-${number}`;

export interface ITicket {
  ticketid: string;
  business?: string;
  contact?: string;
  email?: string;
  subscription: string;
  mfg: string;
  eqtype: string;
  prodno: string;
  moreinfo: string;
  status: string;
  daterequested: Date;
  datereleased: Date;
  lastupdated: Date;
}

export type { ITicket as ITicketRecord };
