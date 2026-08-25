interface IContact {
    bid: string;
    cid: string;
    ctype: string;
    status: string;
    verified: boolean;
    contact: string;
    email: string;
    phone1: string;
    phone2: string;
    address_street: string;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: string;
    dateCreated: string;
    dateUpdated: string;
}

interface IContactsResponse {
    contacts: IContact[];
}

export type { IContact, IContactsResponse };
