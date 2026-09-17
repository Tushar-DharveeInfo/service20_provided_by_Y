import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';
import { FnGetAppDateFormat } from './FnGetAppDateFormat';

const padDatePart = (value: number): string => value.toString().padStart(2, '0');

/* Format year/month/day using app date format without UTC timezone shift. */
const formatLocalCalendarDate = (year: number, month: number, day: number): string => {
    const format = FnGetAppDateFormat();
    if (format === 'MM/dd/yyyy') {
        return `${padDatePart(month)}/${padDatePart(day)}/${year}`;
    }
    return `${padDatePart(day)}/${padDatePart(month)}/${year}`;
};

/* API expects StartDate / EndDate as MM/DD/YYYY — same calendar day the user picked. */
export const formatFilterLogDate = (dateValue: unknown): string => {
    if (dateValue == null || dateValue === '') {
        return '';
    }

    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return formatLocalCalendarDate(
            dateValue.getFullYear(),
            dateValue.getMonth() + 1,
            dateValue.getDate()
        );
    }

    const dateText = String(dateValue).trim();
    if (!dateText) {
        return '';
    }

    const slashParts = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashParts) {
        const first = Number(slashParts[1]);
        const second = Number(slashParts[2]);
        const year = Number(slashParts[3]);
        const format = FnGetAppDateFormat();
        if (format === 'MM/dd/yyyy') {
            return formatLocalCalendarDate(year, first, second);
        }
        return formatLocalCalendarDate(year, second, first);
    }

    const isoParts = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoParts) {
        return formatLocalCalendarDate(
            Number(isoParts[1]),
            Number(isoParts[2]),
            Number(isoParts[3])
        );
    }

    return FnConvertDateToUtcOrUtcToDate(dateText, false, false);
};

const getYesterdayDate = (): Date => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
};

export const getFilterLogDefaultStartDate = (): string =>
    formatFilterLogDate(getYesterdayDate());

export const getFilterLogDefaultEndDate = (): string =>
    formatFilterLogDate(new Date());

export const resolveFilterLogDateRange = (
    startDate: unknown,
    endDate: unknown
): { StartDate: string; EndDate: string } => ({
    StartDate: formatFilterLogDate(startDate) || getFilterLogDefaultStartDate(),
    EndDate: formatFilterLogDate(endDate) || getFilterLogDefaultEndDate(),
});
