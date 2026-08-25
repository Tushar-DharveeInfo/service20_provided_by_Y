
import type { AuthSession } from "@n20a/libauth";
import type { IAddress } from "@n20a/libform";

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

const FnBuildMyProfileProfileString = (
    authUser: TMyProfileAuthUser,
    address: IAddress
): string => {
    const latitude = address.Latitude?.trim() ?? "";
    const longitude = address.Longitude?.trim() ?? "";

    const profile = {
        Company: authUser.tenantNickname ?? "",
        Login: authUser.username ?? "",
        Name: authUser.displayName ?? "",
        Email: authUser.email ?? "",
        Phone: getPhoneNumber(authUser),
        Address1: address.Address1 ?? "",
        Address2: address.Address2 ?? "",
        City: address.City ?? "",
        State: address.State ?? "",
        Country: address.Country ?? "",
        Zip: address.Zip ?? "",
        CountryCode: address.CountryCode ?? "",
        GPS: latitude && longitude ? `${latitude},${longitude}` : "",
        TimezoneOffset: address.TimezoneOffset ?? "",
    };

    return JSON.stringify([profile]);
};

export { FnBuildMyProfileProfileString };
export type { TMyProfileAuthUser };
