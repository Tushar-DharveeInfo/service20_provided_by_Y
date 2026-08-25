
import { IRefData } from "../../allinterface/basic/IRefData";
import { IRefItem } from "../../context/allinterface/IMainApp";

//This function reads data from cache and returns matching reference list data
const FnGetRefList = (
    refName: string,
    refData?: IRefItem[]
): IRefData[] => {
    try {
        const filterData: IRefData[] = [];

        if (
            !refName ||
            typeof refName !== "string" ||
            !Array.isArray(refData) ||
            !refData.length
        ) {
            return filterData;
        }

        const resultArray = refName
            .split(";")
            .map((item) => item.trim())
            .filter(Boolean);

        const normalizedGroupName =
            "reference list";

        for (const element of resultArray) {
            try {
                const normalizedElement =
                    element.toLowerCase();

                const filterObj = refData.filter(
                    (item) =>
                        item?.GroupName
                            ?.trim()
                            .toLowerCase() ===
                        normalizedGroupName &&
                        item?.SubGroupName
                            ?.trim()
                            .toLowerCase() ===
                        normalizedElement
                );

                if (filterObj.length > 0) {
                    const cleanArr: IRefData[] = [];

                    for (const refItem of filterObj) {
                        try {
                            cleanArr.push({
                                Name:
                                    refItem.SubGroupName,
                                Value: refItem.Name,
                                Label: refItem.Name,
                                SortOrder:
                                    refItem.SortOrder,
                                Description: "",
                                EntID: refItem.EntID,
                                RefValue:
                                    refItem.RefValue
                            });
                        } catch (itemError) {
                            console.error(
                                "Error processing ref item:",
                                itemError
                            );
                        }
                    }

                    filterData.push(...cleanArr);
                }
            } catch (filterError) {
                console.error(
                    "Error filtering ref data:",
                    filterError
                );
            }
        }

        if (filterData.length > 0) {
            filterData.sort((a, b) =>
                (a?.SortOrder ?? 0) >
                    (b?.SortOrder ?? 0)
                    ? 1
                    : -1
            );
        }

        return filterData;
    } catch (error) {
        console.error(
            "Error in get ref list:",
            error
        );

        return [];
    }
};

export { FnGetRefList };