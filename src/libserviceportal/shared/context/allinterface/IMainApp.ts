
import { IStatusBar } from "./IStatusBar";
import { AuthSession } from "@n20a/libauth";


interface IFeatureItem {
    PopupQa?: boolean;
    MenuID: string;
    _Feature: string;
    Label: string;
    NodeType: string;
    Tooltip: string;
    FeatureTag: string;
    SortOrder: number;
    DefaultQA: boolean;
    FilterForm: string;
    SearchPrompt: string | null;
    Secured: boolean;
    Internet?: boolean;
    PaneProps?: string;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
    Lock?: boolean;
    Alias?: string;
    [key: string]: string | any;
}

interface IApItem {
    CanChange: number;
    IsRequired: number;
    GroupName: string;
    GroupNameDesc: string;
    SubGroupEntID: string;
    SubGroupName: string;
    SubGroupNameDesc: string;
    _AP: string;
    Name: string;
    PropertyLabel: string;
    NameDesc: string;
    DefaultAPValue: string;
    Value: string;
    ValueDesc: string;
    SortOrder: number;
    MaxInstances: number;
    InputMask: string;
    RegEx: string;
    DisplayGroupControl: string;
    DisplayControl: string;
    ChangeEvent: string;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
}

interface IAlertProfileItem {
    GroupName: string;
    _AlertProfile: string;
    UserName: string;
    EscalationLevel: number;
    AttemptCount: number;
    AlertSeverity: string;
    Duration: string;
    HTML: string;
    Keywords: string;
    DateCreated: string;
    LastUpdatedBy: string;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
}

interface IFeatureForHelp {
    featureID: string;
    featureName: string;
}

interface IRefItem {
    GroupName: string;
    SubGroupName: string;
    Name: string;
    RefValue: string;
    SortOrder: number;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
}

interface IEmItem {
    TableName: string;
    PName: string;
    RequiredToAddRecord: boolean;
    RequiredToUpdateRecord: boolean;
    DefaultValue: string;
    DisplayControl: string;
    ExcludeDataGridField?: boolean | number | string;
    NullNotAllowed?: boolean;
    [key: string]: unknown;
}

interface IUserProfileRecord {
    Email: string;
    Enabled: boolean;
    _User: string;
    Shortname: string;
    EntID: string;
    RecID: string;
    Designation?: string;
    TimeZone?: string;
    DisplayTheme?: string;
    Secured?: boolean;
    IsNZ?: boolean;
    EntityName?: string;
    NodeType?: string;
}

/** Auth-facing user fields available app-wide (from Authentication AuthSession). */
interface IUserInfo {
    displayName: string;
    username: string;
    email?: string;
    tenantNickname?: string;
    phoneNumber?: string;
    bid?: string;
    cid?: string;
}

/** Subscription / license row shared via MainApp context. */
interface IUserSubscription {
    ProductName: string;
    _NZLicenseKey: string;
    StartDate: string;
    EndDate: string;
    UserCount: number;
    RackCount: number;
    Secured: boolean;
    IsNZ: boolean;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
}

/** Combined auth user + subscription licenses for reuse across features. */
interface IUserInfoAndSubscription {
    userInfo: IUserInfo;
    subscription: IUserSubscription[];
}
interface IUserAuthSession {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    phoneNumber: string | null;
    authType: string;
    tenantNickname: string | null;
    bid?: string,
    cid?: string,
}

interface IMainApp {
    featureRecords: IFeatureItem[];
    setFeatureRecords: React.Dispatch<React.SetStateAction<IFeatureItem[]>>;

    allFeatureRecords: IFeatureItem[];
    setAllFeatureRecords: React.Dispatch<React.SetStateAction<IFeatureItem[]>>;

    apRecords: IApItem[];
    setApRecords: React.Dispatch<React.SetStateAction<IApItem[]>>;

    emRecords: IEmItem[];
    setEmRecords: React.Dispatch<React.SetStateAction<IEmItem[]>>;

    authSession?: IUserAuthSession;
    setAuthSession: React.Dispatch<React.SetStateAction<IUserAuthSession | undefined>>;

    /** Auth user display info + subscription licenses for status bar and features. */
    userInfoAndSubscription?: IUserInfoAndSubscription;
    setUserInfoAndSubscription: React.Dispatch<
        React.SetStateAction<IUserInfoAndSubscription | undefined>
    >;

    alertProfileRecords: IAlertProfileItem[];
    setAlertProfileRecords: React.Dispatch<
        React.SetStateAction<IAlertProfileItem[]>
    >;

    alertRecords: Record<string, any>[];
    setAlertRecords: React.Dispatch<
        React.SetStateAction<Record<string, any>[]>
    >;

    refTableRecords: IRefItem[];
    setRefTableRecords: React.Dispatch<
        React.SetStateAction<IRefItem[]>
    >;

    deploymentVars: Record<string, any>[];
    setDeploymentVars: React.Dispatch<
        React.SetStateAction<Record<string, any>[]>
    >;

    isInternetAvailable: boolean;
    setIsInternetAvailable: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    selectedFeatureForHelp?: IFeatureForHelp;
    setSelectedFeatureForHelp: React.Dispatch<
        React.SetStateAction<IFeatureForHelp | undefined>
    >;

    fetchAlertProfileRecords: (statusBarContext: IStatusBar) => void;

    /**
     * Writes a single activity-log document to Firestore.
     * User identity (bid, cid, displayName, username, email) is taken
     * automatically from the current `authSession` stored in this context —
     * the caller only needs to supply the human-readable message string.
     */
    createActivityLog: (message: string) => Promise<void>;
}


export type {
    IMainApp,
    IApItem,
    IFeatureItem,
    IFeatureForHelp,
    IAlertProfileItem,
    IRefItem,
    IEmItem,
    IUserProfileRecord,
    IUserInfo,
    IUserSubscription,
    IUserInfoAndSubscription,
    IUserAuthSession
};
