
function FnGetEntityErrorMessage(respData: unknown[]) {
    let message = '';
    if (respData && respData.length) {
        respData.forEach((element: unknown, index: number) => {
            if (element && typeof element === "object" && "ErrorString" in element) {
                const errorString = (element as { ErrorString?: unknown }).ErrorString;
                if (typeof errorString === "string" && errorString) {
                    if (index === 0) {
                        message = errorString;
                    } else {
                        message += ("<br/>" + errorString);
                    }
                }
            }
        });
    }
    return message;
}

export { FnGetEntityErrorMessage }
