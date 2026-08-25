
// this function will return session storage item
const FnGetSessionStorageItem = (key: string) => {
    return window.sessionStorage.getItem(key);
}

export { FnGetSessionStorageItem }