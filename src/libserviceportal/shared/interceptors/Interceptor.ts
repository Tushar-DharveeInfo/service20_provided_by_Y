/*
 * Host wiring for the portable fetch interceptor.
 *
 * Rest of the app keeps importing from this file.
 * When moving FetchInterceptorCore to a library, change ONLY this file:
 *   - import createFetchInterceptor from the library package
 *   - keep the same exports below (typed with host IApiResponse / IFetchProps / IStatusBar)
 */
import type {
    IFetchProps,
    IFetchStatusbarContainer,
} from "../../appcontainer/allinterface/IStatusBarContainer";
import { FnGetEntityErrorMessage } from "../allcommon/FnGetEntityErrorMessage";
import { FnGetTodayTimeString } from "../allcommon/FnGetTodayTimeString";
import type { IApiResponse } from "../allinterface/IApiResponse";
import type { IStatusBar } from "../context/allinterface/IStatusBar";
import { getDiagnosticLevelData } from "../context/contextandprovider/CommonVariable";
import { createAxiosInterceptor } from '@n20a/libaxios'
import { FnGetUserSessionId } from "../context/contextandprovider/StatusBar";

const getBaseApiUrl = (customBaseUrl?: string): string => {
    if (customBaseUrl) return customBaseUrl;

    // const envBaseUrl = FnGetEnvVariableByKey(envVarEnums.N20_API_URL);
    // if (envBaseUrl) return envBaseUrl;

    const prodUrl = window?.location?.origin ?? "";
    const isProd = import.meta.env.PROD;
    // return isProd ? `${prodUrl}/n20api` : "https://n20a.netzoom.com/n20api";
    return prodUrl
};

const makeSessionIdString = (key: string) => {
    if (import.meta.env.DEV)
        console.log('key :', key);

    const sessionId = FnGetUserSessionId();
    return sessionId ? `nzSessionId ${sessionId}` : null
}

const interceptorApi = createAxiosInterceptor({
    getSessionId: makeSessionIdString,
    getBaseApiUrl,
    getDiagnosticLevel: getDiagnosticLevelData,
    getTodayTimeString: FnGetTodayTimeString,
    getEntityErrorMessage: FnGetEntityErrorMessage,
    sessionStorageKey: "user_session",
    sessionHeaderName: "Authorization",
    defaultTimeoutMs: 60000,
});

// Host-typed wrappers so callers keep using IApiResponse / IFetchProps / IStatusBar.
const axiosInterceptor = (
    fetchProps: IFetchProps,
    statusBarContext: IStatusBar
): Promise<IApiResponse> =>
    interceptorApi.axiosInterceptor(fetchProps, statusBarContext) as Promise<IApiResponse>;

const axiosInterceptorWithoutUI = (
    props: IFetchStatusbarContainer
): Promise<IApiResponse> =>
    interceptorApi.axiosInterceptorWithoutUI(props) as Promise<IApiResponse>;

const axiosInterceptorForTest = (
    fetchProps: IFetchProps,
    statusBarContext: IStatusBar
): Promise<IApiResponse> =>
    interceptorApi.axiosInterceptorForTest(fetchProps, statusBarContext) as Promise<IApiResponse>;

const {
    axiosInterceptorForPostResponse,
    axiosInterceptorForPowerBi,
    axiosInterceptorForHead,
    axiosInterceptorToGetFileFromPublic,
    axiosInterceptorForHeadAll,
    axiosInterceptorForThirdPartyApis,
} = interceptorApi;

export {
    axiosInterceptor,
    axiosInterceptorWithoutUI,
    axiosInterceptorForTest,
    axiosInterceptorForPostResponse,
    axiosInterceptorForPowerBi,
    axiosInterceptorForHead,
    axiosInterceptorToGetFileFromPublic,
    axiosInterceptorForHeadAll,
    axiosInterceptorForThirdPartyApis,
};
