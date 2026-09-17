
import { IVssDownloadDoc } from "../../../features/services/myrequests/tickets/ICollections";

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

interface IFeatureForHelp {
    featureID: string;
    featureName: string;
}

interface IUserAuthSession {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    phoneNumber: string | null;
    authType: string;
    tenantNickname: string | null;
    bucketName: string;
    baseFolder: string;
    bid?: string;
    cid?: string;
    authrole?: string;
    role?: string;
    toolboxRole?: string;
    isAuthenticated?: boolean;
    permittedapps?: string[];
    claims?: Record<string, unknown> | null;
    ProductName?: string;
    licenseKey?: string;
    licenseDetails?: Record<string, any>;
}

interface IMainApp {
    featureRecords: IFeatureItem[];
    setFeatureRecords: React.Dispatch<React.SetStateAction<IFeatureItem[]>>;

    authSession?: IUserAuthSession;
    setAuthSession: React.Dispatch<React.SetStateAction<IUserAuthSession | undefined>>;

    deploymentVars: Record<string, any>[];
    setDeploymentVars: React.Dispatch<
        React.SetStateAction<Record<string, any>[]>
    >;

    selectedFeatureForHelp?: IFeatureForHelp;
    setSelectedFeatureForHelp: React.Dispatch<
        React.SetStateAction<IFeatureForHelp | undefined>
    >;


    /**
     * Writes a single activity-log document to Firestore.
     * User identity (bid, cid, displayName, username, email) is taken
     * automatically from the current `authSession` stored in this context —
     * the caller only needs to supply the human-readable message string.
     */
    createActivityLog: (message: string) => Promise<void>;
    createDownloadDocLog: (downloadDoc: IVssDownloadDoc) => Promise<void>;

    distinctProductKeys: string[];
    setDistinctProductKeys: React.Dispatch<React.SetStateAction<string[]>>;
}


export type {
    IMainApp,
    IFeatureItem,
    IFeatureForHelp,
    IUserAuthSession
};
