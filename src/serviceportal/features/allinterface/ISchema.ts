export interface IBusiness {
  bid: string;
  btype: string;
  status: string;
  verified: boolean;
  salesexec: string;
  bname: string;
  country: string;
  state: string;
  daysnoticeperiod: number;
  mmfinyear: number;
  relatedbids: string[];
  datecreated: string;
  dateupdated: string;
  name: string;
  updatedby: string;
  createdby: string;
}

export interface IContact {
  cid: string;
  bid: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  country: string;
  role: string;
  status: string;
  datecreated: string;
  dateupdated: string;
}

export interface IAddress {
  type: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  countrycode: string;
  timezoneoffset: number;
}

export interface ITicket {
  ticketid: string;
  subscription: string;
  mfg: string;
  eqtype: string;
  prodno: string;
  moreinfo: string;
  status: string;
  daterequested: string;
  datereleased: string;
  lastupdated: string;
}

export interface IDownload {
  subsused: string;
  filename: string;
  date: string;
  fileurl: string;
}

export interface INote {
  noteid: string;
  message: string;
  filename: string;
  datecreated: string;
}

export interface IOrder {
  orderid: string;
  title: string;
  filename: string;
  status: string;
  amount: number;
  datecreated: string;
}

export interface ISubscription {
  subscriptionid: string;
  product: string;
  status: string;
  startdate: string;
  enddate: string;
  datecreated: string;
}

export interface IContactSubcollections {
  addresses?: IAddress[];
  tickets?: ITicket[];
  downloads?: IDownload[];
  notes?: INote[];
  orders?: IOrder[];
  subscriptions?: ISubscription[];
}

export interface IBusinessWithContacts extends IBusiness {
  contacts?: Array<IContact & IContactSubcollections>;
}
