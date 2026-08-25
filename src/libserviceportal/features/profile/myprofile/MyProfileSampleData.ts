/*
 * SAMPLE DATA: user address for Profile/MyProfile while address APIs are disabled.
 */
import type { IAddress } from "@n20a/libform";

/* Address in the shape AddressForm expects for initialAddress. */
const sampleUserAddress: IAddress = {
    Address1: "500 West Madison Street",
    Address2: "Suite 2400",
    City: "test",
    State: "IL",
    Country: "United States",
    Zip: "60661",
    CountryCode: "US",
    Latitude: "41.8819",
    Longitude: "-87.6398",
    TimezoneOffset: "-06:00"
};

export { sampleUserAddress };
