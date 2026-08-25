import { IStatusBar } from "./IStatusBar";

interface IApProfileItem {
    GroupName: string;
    SubGroupName: string;
    _AP: string;
    InstanceName: string;
    InstanceDesc: string;
    ProfileType: string;
    Multiple: string;
    ProfileString: string;
    EntID: string;
    RecID: string;
    LastUpdated: string;
    EntityName: string;
    NodeType: string;
    Value?: string | any;

}

interface IApProfile {
    apProfileRecords: IApProfileItem[] | undefined;
    setApProfileRecords: (data: IApProfileItem[]) => void;
    fetchApProfile: (reCall?: boolean, statusBarContext?: IStatusBar) => void;
}

export type { IApProfile, IApProfileItem }