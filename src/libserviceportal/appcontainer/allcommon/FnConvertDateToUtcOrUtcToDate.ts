import { FnGetAppDateFormat } from "../../shared/allcommon/basic/FnGetAppDateFormat";

const FnConvertDateToUtcOrUtcToDate = (
    dateInput: string,
    toUTC: boolean,
    showTime: boolean = true
): string => {
    if (!dateInput || typeof dateInput !== "string" || !dateInput.length) {
        return "";
    }
    const format = FnGetAppDateFormat(); // "MM/dd/yyyy" or "dd/MM/yyyy"
    const pad = (n: number) => n.toString().padStart(2, "0");
    try {


        const formatAMPM = (date: Date): string => {
            let hours = date.getHours();
            const minutes = pad(date.getMinutes());
            const ampm = hours >= 12 ? "PM" : "AM";

            hours = hours % 12;
            hours = hours ? hours : 12;

            return `${pad(hours)}:${minutes} ${ampm}`;
        };

        if (toUTC) {
            const parts = (dateInput ?? "").split(/[\/\-\s:]/).map(Number);

            let day = 0,
                month = 0,
                year = 0,
                hours = 0,
                minutes = 0,
                seconds = 0;

            if (format === "MM/dd/yyyy") {
                [month, day, year, hours = 0, minutes = 0, seconds = 0] = parts;
            } else {
                [day, month, year, hours = 0, minutes = 0, seconds = 0] = parts;
            }

            if (!year || !month || !day) {
                console.error("Invalid date input for local → UTC conversion");
            }

            const date = new Date(year, month - 1, day, hours, minutes, seconds);

            return showTime
                ? date.toISOString().replace(/\.\d+Z$/, "Z")
                : date.toISOString().substring(0, 10);

        } else {
            let utcDate: Date;

            if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
                utcDate = new Date(dateInput);
            } else {
                const parts = dateInput.split(/[\/\-\s:]/).map(Number);
                let day = 0,
                    month = 0,
                    year = 0,
                    hours = 0,
                    minutes = 0,
                    seconds = 0;

                if (format === "MM/dd/yyyy") {
                    [month, day, year, hours = 0, minutes = 0, seconds = 0] = parts;
                } else {
                    [day, month, year, hours = 0, minutes = 0, seconds = 0] = parts;
                }

                utcDate = new Date(year, month - 1, day, hours, minutes, seconds);
            }

            if (isNaN(utcDate.getTime())) {
                console.error("Invalid date input for UTC → local conversion");
            }

            const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);

            let dateStr: string;
            if (format === "MM/dd/yyyy") {
                dateStr = `${pad(localDate.getMonth() + 1)}/${pad(localDate.getDate())}/${localDate.getFullYear()}`;
            } else {
                dateStr = `${pad(localDate.getDate())}/${pad(localDate.getMonth() + 1)}/${localDate.getFullYear()}`;
            }

            if (!showTime) return dateStr;

            return `${dateStr} ${formatAMPM(localDate)}`;
        }
    } catch (error) {
        console.error('Error in convert date :', error);
        return "";
    }
};


export { FnConvertDateToUtcOrUtcToDate };
