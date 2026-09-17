
// This function returns file extension from file name 
function FnGetExtensionFromFileName(name: string) {
    if (name.length > 0) {
        const arr = name.split(".");
        if (arr.length > 0) {
            return name.split(".").pop();
        }
        else {
            return name;
        }
    }
    else {
        return name;
    }
}

export { FnGetExtensionFromFileName }