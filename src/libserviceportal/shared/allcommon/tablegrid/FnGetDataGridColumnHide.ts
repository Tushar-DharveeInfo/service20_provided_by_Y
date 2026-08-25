import { FnIsTruthyFlag } from "../FnIsTruthyFlag";
import { IEmItem } from '../../context/allinterface/IMainApp';

const FORENSIC_LOG_EM_TABLE = '_ForensicLog';

const getExcludeDataGridFieldValue = (
    columnExcludeField: unknown,
    emRecords: IEmItem[] | undefined,
    tableName: string,
    pName: string
): unknown => {
    if (columnExcludeField !== undefined && columnExcludeField !== null && columnExcludeField !== '') {
        return columnExcludeField;
    }

    const emRecord = emRecords?.find(
        (item) =>
            item.TableName?.toLowerCase() === tableName.toLowerCase() &&
            item.PName?.toLowerCase() === pName.toLowerCase()
    );

    return emRecord?.ExcludeDataGridField;
};

/* Session preference wins; otherwise hide when EM.PG ExcludeDataGridField is truthy. */
const FnGetDataGridColumnHide = (
    savedIsHidden: boolean | undefined,
    excludeDataGridField: unknown
): boolean => {
    if (savedIsHidden !== undefined) {
        return savedIsHidden;
    }
    return FnIsTruthyFlag(excludeDataGridField);
};

export { FnGetDataGridColumnHide, getExcludeDataGridFieldValue, FORENSIC_LOG_EM_TABLE };
