


type ICascadeComboOption = { Option: string };
type ICascadingComboInitialValues = Record<string, string | null>;

type ISiteRefOption = { label: string; value: string; entId: string };

interface ITenantUserRecord {
    UserID: string;
    UserName: string;
}

interface ITenantRecord {
    TenantID: string;
    TenantName: string;
    Users: ITenantUserRecord[];
}

interface ITenantSiteData {
    tenants: ITenantRecord[];
    defaultTenantName: string;
    defaultUserName: string;
}

interface ISiteTenantUserCascadeValues {
    SiteName: string;
    TenantName: string;
    UserName: string;
}

interface ISiteTenantUserCascade {
    uniqueName?: string;
    /*When "node", site combo is disabled (session site). */
    loginType?: string;
    /*Site name from parent profile — required initial value when site is locked. */
    profileSiteName?: string;
    /*Restores last applied cascade values when filter reopens (skips session defaults). */
    initialSiteName?: string;
    initialTenantName?: string;
    initialUserName?: string;
    onValuesChange: (
        values: ISiteTenantUserCascadeValues,
        options?: { isDefault?: boolean }
    ) => void;
}


export type { ISiteTenantUserCascade, ISiteTenantUserCascadeValues, ITenantSiteData, ICascadeComboOption, ICascadingComboInitialValues, ISiteRefOption, ITenantRecord, ITenantUserRecord };
