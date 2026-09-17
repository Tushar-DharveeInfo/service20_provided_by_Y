
// this function returns the Date Format from Session storage
const FnGetAppDateFormat = () => {
  let storageItem = sessionStorage.getItem("app_date_format");
  if (storageItem && storageItem.length > 0) {
    storageItem = storageItem?.toLowerCase().replace(/mm/g, "MM");
    return storageItem;
  }
  else {
    return "MM/dd/yyyy";
  }
}

export { FnGetAppDateFormat }