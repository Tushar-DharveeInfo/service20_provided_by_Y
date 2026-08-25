
import { JSX } from 'react'
import { IErrorData } from '../../shared/context/allinterface/IStatusBar';

interface IFetchProps {
    url: string,
    method?: string | "GET" | "POST",
    customBaseUrl?: string;
    data?: unknown; //requested payload
    allowShowLoader?: boolean;
    disableLog?: boolean;
    customHeader?: Record<string, string>;
    callSilently?: boolean,
    timeout?: number; // Custom timeout in milliseconds (default: 60000)
    signal?: AbortSignal; // Optional AbortSignal to cancel the in-flight request
    setFetchData: (data: any, status?: string, errData?: IErrorData[]) => void,   //set data from fetch response
}

interface IStatsJson {
    [key: string]: string | number;
}
interface IStatusBarContainer {
    uniqueName: string;//unique identifire for the control
    featureId?: string;
    StatusBartype?: 'menu' | 'appqa'; // 'menu' | 'appqa'
    FetchProps?: IFetchProps;
    statusBarData?: Record<string, number | string> | string;
}


interface IFetchStatusbarContainer {
    FetchProps: IFetchProps;
    setFetchDataError: (data: IErrorData[] | null) => void;
    setFetchError: (data: string | string[] | null) => void;
    setFetchPercentCompleted?: (data: number) => void;
    signal?: AbortSignal; // Optional external abort signal for cleanup
}

interface IStatusBarCard {
    uniqueName: string;
    id: string;
    cardPurpose: 'Error' | 'testapi' | 'useraction' | 'info' | 'Message' | 'Broadcast' | 'Timeout';
    duration: number;
    severity: "Normal" | "Warning" | "Critical";
    titleData: string | string[];
    contentData?: string | JSX.Element;
    alertProfileID?: string;
    escalationLevel?: number;
    attemptCount?: number;
    lastDelivered?: string;
    lastUpdated?: string;
    html?: string;
    entID?: string;
    recID?: string;
    messageSource?: string;
    handleCloseClick: (id: string) => void;
}

interface IStatusBarItem {

    cardPurpose: 'Error' | 'testapi' | 'useraction' | 'info' | 'Message' | 'Broadcast' | 'Timeout';
    duration: number;
    severity: "Normal" | "Warning" | "Critical";
    titleData: string;
    _AlertQueue: string;
    contentData?: string | JSX.Element;
    alertProfileID?: string;
    escalationLevel?: number;
    attemptCount?: number;
    lastDelivered?: string;
    lastUpdated?: string;
    html?: string;
    entID?: string;
    recID?: string;
    messageSource?: string;
}

interface IStatusBarTitleContainer {
    uniqueName: string;
    isError: boolean;
    titleData: string | string[];
    isOpen: boolean;
    cardsCount: number;
    isInternetAvailable: boolean;
    handleOpenCloseStatusBar: () => void;
    criticalAlertCount?: number;
    isShowFullTitle?: boolean;
    handleShowFullTitle?: () => void;
    handleClearClick?: () => void;
}

type IAlertQueueApiItem = {
    AlertSeverity?: string;
    MessageSource?: IStatusBarItem["cardPurpose"];
    AlertProfileName?: string;
    _AlertQueue?: string;
    HTML?: string;
    AlertProfileID?: string;
    EscalationLevel?: number;
    AttemptCount?: number;
    LastDelivered?: string;
    LastUpdated?: string;
    EntID?: string;
    RecID?: string;
};
export type { IStatusBarContainer, IFetchStatusbarContainer, IFetchProps, IStatsJson, IStatusBarItem, IStatusBarCard, IStatusBarTitleContainer, IAlertQueueApiItem }
