import { FnGetSessionVariableFromStorage } from './FnGetSessionVariableFromStorage';
import { ISession } from '../../context/allinterface/ISession';

export interface ISessionCascadePreferences {
    siteName: string;
    siteId: string;
    /* `undefined` when session has no TenantName row; otherwise trimmed value (may be empty). */
    tenantName: string | undefined;
    /* `undefined` when session has no LoginUserName row; otherwise trimmed value (may be empty). */
    userName: string | undefined;
}

/* Reads  tenant / user defaults from the session table. */
export const getSessionCascadePreferences = (
    sessionList: ISession[]
): ISessionCascadePreferences => {
    const siteName = FnGetSessionVariableFromStorage('Location', 'SiteName', sessionList)?.[0]?.SessionValue?.trim() ?? '';
    const siteId = FnGetSessionVariableFromStorage('Location', 'SiteID', sessionList)?.[0]?.SessionValue?.trim() ?? '';
    const tenantList = FnGetSessionVariableFromStorage('Filter', 'TenantName', sessionList);
    const userList = FnGetSessionVariableFromStorage('RequestedBy', 'LoginShortName', sessionList);

    return {
        siteName,
        siteId,
        tenantName: tenantList?.length
            ? tenantList[0].SessionValue?.trim() ?? ''
            : undefined,
        userName: userList?.length
            ? userList[0].SessionValue?.trim() ?? ''
            : undefined,
    };
};
