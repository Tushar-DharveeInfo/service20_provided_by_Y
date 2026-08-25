
//This function returns file name from full name 
function FnGetNameFromFileName(name: string) {
    if (name.length > 0) {
        const arr = name.split(".");
        if (arr.length > 0) {
            arr.pop();
            return arr.join('.');
        }
        else {
            return name;
        }
    }
    else {
        return name;
    }
}

export { FnGetNameFromFileName }