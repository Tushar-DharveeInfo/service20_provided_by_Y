
import { IStatusBarItem } from "../allinterface/IStatusBarContainer";

function FnSortStatusBarCards(
    items: IStatusBarItem[]
): IStatusBarItem[] {
    const severityOrder: Record<IStatusBarItem["cardPurpose"], number> = {
        Broadcast: 6,
        Message: 5,
        Error: 4,
        info: 3,
        testapi: 2,
        useraction: 1,
        Timeout: 0
    };

    // Format: DD/MM/YYYY hh:mm AM/PM
    const parseDate = (dateStr?: string): number => {
        if (!dateStr) return 0;

        const match = dateStr.match(
            /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i
        );

        if (!match) return 0;

        const [, day, month, year, hourStr, minute, period] = match;

        let hour = Number(hourStr);

        if (period.toUpperCase() === "PM" && hour !== 12) {
            hour += 12;
        }

        if (period.toUpperCase() === "AM" && hour === 12) {
            hour = 0;
        }

        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            hour,
            Number(minute)
        ).getTime();
    };

    return [...items].sort((a, b) => {
        // 1. Sort by cardPurpose priority
        const severityDiff =
            severityOrder[b.cardPurpose] -
            severityOrder[a.cardPurpose];

        if (severityDiff !== 0) {
            return severityDiff;
        }

        // 2. Same cardPurpose -> newest first
        return parseDate(b.lastUpdated) - parseDate(a.lastUpdated);
    });
}
export { FnSortStatusBarCards }