
import type { AuthSession } from "@n20a/libauth";
import type { IContactDoc } from "@n20a/libfsdb";

type TMyProfileAuthUser = Pick<AuthSession, "tenantNickname" | "username" | "displayName" | "email"> & {
    phoneNumber?: string | null;
};

const getPhoneNumber = (authUser: TMyProfileAuthUser): string => {
    if (authUser.phoneNumber) {
        return authUser.phoneNumber;
    }

    const rawUser = authUser as AuthSession & { phoneNumber?: string | null };
    return rawUser.phoneNumber ?? "";
};

const FnBuildMyProfileString = (
    authUser: TMyProfileAuthUser,
    contact: IContactDoc
): string => {
    const profile = {

        Company: authUser.tenantNickname ?? "",
        Login: authUser.username ?? "",
        Name: authUser.displayName ?? "",
        Email: authUser.email ?? "",
        Phone: getPhoneNumber(authUser),
        Address1: contact.address1 ?? "",
        Address2: contact.address2 ?? "",
        City: contact.city ?? "",
        State: contact.state ?? "",
        Country: contact.country ?? "",
        Zip: contact.zip ?? "",
        CountryCode: contact.countrycode ?? "",
        TimezoneOffset: contact.timezoneoffset ?? "",
        Donotcallme: Boolean(contact?.donotcallme),
        Removemefrommailinglist: Boolean(contact?.removemefrommailinglist),
        Smsoptin: Boolean(contact?.smsoptin),
    };

    return JSON.stringify([profile]);
};

export { FnBuildMyProfileString };
export type { TMyProfileAuthUser };
