
import { AuthSession } from "@n20a/libauth";
import type { ISession } from "../libserviceportal";
type Stage = 1 | 2;
interface IAuthorizeResult {
    sessionId: string;
    sessionVariables: ISession[];
    isNewSession: boolean;

}
interface IAuthorizationError {
    message: string;
}
interface ISplashLoader {
    uniqueName: string;
    message: string | null;
    currentStage: Stage;
    allowSplashScreen?: boolean;
    loadingMessage?: string;
}
interface IAuthorization {
    uniqueName: string;
    apiBaseUrl: string;
    onSuccess: (authData: IAuthorizeResult) => void;
    userData?: AuthSession;
    onError?: (error: string) => void;
}

interface IJsonSessionOutput {
    TotalOpenSessions: number;
    SessionValues: ISession[];
}

interface ISessionApiResponse {
    newSessionID: string;
    jsonSessionOutput: string;
}
interface IApiResponse<T> {
    status: number;
    data: T;
    errData?: {
        errCode: number;
        errString: string;
        isErr: boolean;
        timeStamp: string;
    }[];
}
interface ICreateSessionResponse {
    newSessionID: string;
    jsonSessionOutput: string;
}
interface IIsSessionOpenResponse {
    isOpen: boolean;
    jsonStringOutput: string;
}

export type { IAuthorization, IAuthorizationError, IAuthorizeResult, ISplashLoader, IApiResponse, ISessionApiResponse, IJsonSessionOutput, ICreateSessionResponse, IIsSessionOpenResponse, Stage }
