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

export type { IAlertProfileItem }
