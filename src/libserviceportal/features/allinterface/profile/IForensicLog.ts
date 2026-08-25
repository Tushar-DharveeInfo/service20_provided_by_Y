import { IForensicLogPaginationPayload, TGridRowData } from "../../../shared/allinterface/tablegrid/IBasicGrid"
import { ITreeNode } from "../../../shared/allinterface/entity/ITreeNode"

interface IForensicLog {
    uniqueName: string
    featureId: string // feature id
    isSetting: boolean // it indicate render for settings or not 
    loginType: string // we are passing user and node base on setting and logs
    selectedNode?: ITreeNode // selected node for tree
    allowSort?: boolean // allow sort column or not
    hideSearchControl?: boolean,
    handleUpdateHeaderTitle?: (title: string) => void
    handleShowUserMessage?: (messageText: string) => void;
}

interface IForensicLogPayload {
    sessionId?: string;
    filterJsonString: string;
    startPage: number;
    recordCount: number;
}

type IDateRangeField = { startDate?: unknown; endDate?: unknown };

/* Column metadata returned by GetFilteredLog in ColumnList. */
interface IForensicLogColumn {
    PropertyLabel: string;
    PName: string;
    DisplayControl?: string;
    ExcludeDataGridField?: boolean | number | string;
}

/* Cached grid payload used for render, export, and dynamic pagination. */
interface IForensicLogTableData {
    Dataset: TGridRowData | null;
    ColumnList: IForensicLogColumn[] | null;
    apiParams: IForensicLogPayload & IForensicLogPaginationPayload;
}

/* Filter fields used when building GetFilteredLog / download payloads. */
interface IForensicLogFilterFormData extends Record<string, unknown> {
    Users?: string;
    UserName?: string;
    ANDOR?: string;
    Keywords?: string;
    FilterBy?: string;
}
export type { IForensicLog, IForensicLogPayload, IDateRangeField, IForensicLogColumn, IForensicLogTableData, IForensicLogFilterFormData }
