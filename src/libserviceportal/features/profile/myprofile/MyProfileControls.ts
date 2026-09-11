
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
    createProfileControl("Address1", "Address 1", 6, "Address", DisplayControlEnums.TextControl),
    createProfileControl("Address2", "Address 2", 7, "Address", DisplayControlEnums.TextControl),
    createProfileControl("City", "City", 8, "Address", DisplayControlEnums.TextControl),
    createProfileControl("State", "State", 9, "Address", DisplayControlEnums.TextControl),
    createProfileControl("Country", "Country", 10, "Address", DisplayControlEnums.TextControl),
    createProfileControl("Zip", "Zip", 11, "Address", DisplayControlEnums.TextControl),
    createProfileControl("CountryCode", "Country Code", 12, "Address", DisplayControlEnums.TextControl),
    createProfileControl("TimezoneOffset", "Timezone Offset", 13, "Address", DisplayControlEnums.TextControl),
    createProfileControl("Donotcallme", "Do Not Call Me", 14, "Address", DisplayControlEnums.TrueFalseControl),
    createProfileControl("Removemefrommailinglist", "Remove Me From Mailing List", 15, "Address", DisplayControlEnums.TrueFalseControl),
    createProfileControl("Smsoptin", "SMS Opt-in", 16, "Address", DisplayControlEnums.TrueFalseControl),
];

const myProfileControls: IControl[] = [
    ...myProfileUserControls,
    ...myProfileAddressControls,
];

export { myProfileControls, myProfileUserControls, myProfileAddressControls };
