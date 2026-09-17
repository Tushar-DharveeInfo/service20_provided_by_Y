
import { IStatusBar } from "../../context/allinterface/IStatusBar";

const { samplePropertyKebabMenuData } = { samplePropertyKebabMenuData: "" } as any; // Placeholder for sample data

type TableRecord = Record<string, unknown>;

const FnNodeGetKebabMenuData = (
    apiPayload: Record<string, any>,
    statusbarContext: IStatusBar
): Promise<TableRecord | undefined> => {
    return new Promise((resolve) => {
        // SAMPLE DATA: NODE.GetKebabMenuData API commented out.
        // axiosInterceptor(
        //     {
        //         url: NODE.GetKebabMenuData,
        //         data: apiPayload,
        //         setFetchData: (resp: unknown, status?: string) => {
        //             if (
        //                 status === "200" &&
        //                 resp &&
        //                 typeof resp === "object" &&
        //                 "propertyJson" in resp &&
        //                 resp.propertyJson
        //             ) {
        //                 const parsed = JSON.parse(resp.propertyJson as string);
        //                 resolve(parsed);
        //                 return;
        //             }
        //             resolve(undefined);
        //         }
        //     },
        //     statusbarContext
        // );
        void apiPayload;
        void statusbarContext;
        resolve(samplePropertyKebabMenuData as TableRecord);
    });
}
export { FnNodeGetKebabMenuData }