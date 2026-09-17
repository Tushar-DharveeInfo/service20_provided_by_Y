

const FnFormatDateWithAppFormat = (
  dateInput: string | Date | number | unknown,
  showTime: boolean = true,
): string => {
  try {
    if (!dateInput) {
      return "";
    }

    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "object" && dateInput !== null) {
      const obj = dateInput as { toDate?: () => Date; seconds?: number; _seconds?: number };
      if (typeof obj.toDate === "function") {
        try {
          date = obj.toDate();
        } catch {
          date = new Date(NaN);
        }
      } else if (typeof obj.seconds === "number") {
        date = new Date(obj.seconds * 1000);
      } else if (typeof obj._seconds === "number") {
        date = new Date(obj._seconds * 1000);
      } else {
        date = new Date(dateInput as string);
      }
    } else if (typeof dateInput === "number") {
      date = new Date(dateInput < 1e11 ? dateInput * 1000 : dateInput);
    } else {
      date = new Date(String(dateInput));
    }

    if (isNaN(date.getTime())) {
      return "";
    }

    const format = "MM/dd/yyyy"

    const pad = (n: number) => n.toString().padStart(2, "0");

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    let formattedDate = "";

    //  Format handling
    if (format === "MM/dd/yyyy") {
      formattedDate = `${month}/${day}/${year}`;
    } else if (format === "dd/MM/yyyy") {
      formattedDate = `${day}/${month}/${year}`;
    } else {
      console.warn("FnFormatDate: Unsupported format →", format);
      formattedDate = `${day}/${month}/${year}`; // fallback
    }

    //  If only date required
    if (!showTime) return formattedDate;

    //  Time formatting
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${formattedDate} ${pad(hours)}:${minutes} ${ampm}`;

  } catch (error) {
    //  Catch unexpected runtime errors
    console.error("FnFormatDate: Unexpected error →", error);
    return "";
  }
};

export { FnFormatDateWithAppFormat };