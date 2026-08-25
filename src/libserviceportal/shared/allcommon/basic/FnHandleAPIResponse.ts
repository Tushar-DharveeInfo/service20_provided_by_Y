
import { FnParseJsonSafely } from "../../../appcontainer/allcommon/FnParseJsonSafely";

// this function return api response
const FnHandleAPIResponse = (jsonData: unknown, keyName: string) => {

  let extractedData: any = null;
  const parsedData =
    typeof jsonData === "string"
      ? FnParseJsonSafely(jsonData)
      : jsonData;

  // Check if parsedData is an object
  if (typeof parsedData === "object" && parsedData !== null) {
    Object.keys(parsedData).forEach((key: string) => {
      const dataObject = parsedData as Record<string, unknown>;
      const currentValue = dataObject[key];

      // Check if the property value is an array and has at least one element
      if (Array.isArray(currentValue) && currentValue.length > 0) {
        const objectData = currentValue[0] as Record<string, any>;

        if (Array.isArray(objectData[keyName])) {
          extractedData = objectData[keyName];
          return;
        }
        else if (typeof objectData[keyName] === "object") {
          extractedData = objectData[keyName];
          return;
        }
        else if (typeof objectData[key] === "string") {
          extractedData = objectData[key];
          return;
        }
      }
    });
  }

  return extractedData;

}

export { FnHandleAPIResponse }