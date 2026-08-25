
import { DisplayControlEnums } from "../../../shared/alldefaultprops/basic/DefaultPropsFormContainer";
import { IControl } from "../../../shared/allinterface/settingsform/ISettingsLibForm";

const createProfileControl = (
    name: string,
    label: string,
    sortOrder: number,
    displayGroupControl: string,
    displayControl: string
): IControl => ({
    CanChange: 0,
    IsRequired: 0,
    GroupName: "Profile",
    GroupNameDesc: displayGroupControl,
    SubGroupEntID: "",
    SubGroupName: "FormControl",
    SubGroupNameDesc: "",
    _AP: name,
    PropertyLabel: label,
    NameDesc: label,
    DefaultAPValue: "",
    Value: "",
    ValueDesc: "",
    SortOrder: sortOrder,
    MaxInstances: 0,
    InputMask: "",
    RegEx: "",
    DisplayGroupControl: displayGroupControl,
    DisplayControl: displayControl,
    ChangeEvent: "",
    Secured: false,
    IsNZ: true,
    EntID: "",
    RecID: "",
    LastUpdated: "",
    EntityName: "_User",
    Name: name,
    disabled: false,
});

const myProfileUserControls: IControl[] = [
    createProfileControl("Company", "Company", 1, "User", DisplayControlEnums.TextControl),
    createProfileControl("Login", "Login", 2, "User", DisplayControlEnums.TextControl),
    createProfileControl("Name", "Name", 3, "User", DisplayControlEnums.TextControl),
    createProfileControl("Email", "Email", 4, "User", DisplayControlEnums.TextControl),
    createProfileControl("Phone", "Phone", 5, "User", DisplayControlEnums.TextControl),
];

const myProfileAddressControls: IControl[] = [
    createProfileControl("Address1", "Address 1", 1, "Address", DisplayControlEnums.TextControl),
    createProfileControl("Address2", "Address 2", 2, "Address", DisplayControlEnums.TextControl),
    createProfileControl("City", "City", 3, "Address", DisplayControlEnums.TextControl),
    createProfileControl("State", "State", 4, "Address", DisplayControlEnums.TextControl),
    createProfileControl("Country", "Country", 5, "Address", DisplayControlEnums.TextControl),
    createProfileControl("Zip", "Zip", 6, "Address", DisplayControlEnums.TextControl),
    createProfileControl("CountryCode", "Country Code", 7, "Address", DisplayControlEnums.TextControl),
    createProfileControl("GPS", "GPS", 8, "Address", DisplayControlEnums.TextControl),
    createProfileControl("TimezoneOffset", "Timezone Offset", 9, "Address", DisplayControlEnums.TextControl),
];

const myProfileControls: IControl[] = [
    ...myProfileUserControls,
    ...myProfileAddressControls,
];

export { myProfileControls, myProfileUserControls, myProfileAddressControls };
