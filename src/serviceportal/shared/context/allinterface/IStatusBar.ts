
interface IErrorData {
    errCode: number;
    errString: string;
    isErr: boolean;
    timeStamp: string;
    apiName?: string;
    difference?: number;
    id?: number;
}


interface IStatusBar {
    IsLoading: boolean;
    LoadingLabel?: string;
    FetchError: string[] | null;
    FetchDataError: IErrorData[] | null;
    UserActionData: string | undefined;
    TestApiData: string | undefined;
    statusBarStringData?: string[];
    actionLogData?: IErrorData[];
    userSessionId: string;
    setFetchDataError: (fatchDataError: IErrorData[] | null) => void;
    setFetchError: (FetchError: string[] | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingLabel: (loadingLabel?: string) => void;
    setTestApiData: (testApiData: string | undefined) => void;
    setUserActionData: (actionData: string | undefined) => void;
    setActionLogData: (actionLogData?: IErrorData[]) => void;
    setStatusBarStringData: (statusBarStringData?: string[]) => void;
    setUserSessionId: (sessionId: string) => void;
    clearAllStatus: () => void;
}



export type { IStatusBar, IErrorData }
