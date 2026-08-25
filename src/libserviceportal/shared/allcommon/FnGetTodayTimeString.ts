
const FnGetTodayTimeString = () => {
    const today = new Date();


    // Get the time components
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const seconds = String(today.getSeconds()).padStart(2, '0');
    const miliseconds = String(today.getMilliseconds()).padStart(3, '0');
    // Create a formatted date string
    const formattedDateString = `${hours}:${minutes}:${seconds}:${miliseconds}`;

    return formattedDateString;
}

export { FnGetTodayTimeString }