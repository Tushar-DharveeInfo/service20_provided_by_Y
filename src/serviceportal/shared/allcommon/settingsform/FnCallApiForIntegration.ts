
import { IEnabledApiResult } from "../../allinterface/settingsform/ISettingsLibForm";
import { FnHandleApiCallForEnabled } from "./FnHandleApiCallForEnabled";

type ShowMessageFn = (message: string, isShowOkOnly?: boolean) => Promise<boolean> | void;

const FnCallApiForIntegration = async (
    container: string,
    prefixString: string,
    handleShowMessage?: ShowMessageFn
): Promise<IEnabledApiResult["data"] | undefined> => {
    try {
        const normalizedContainer = container
            ?.trim()
            .toLowerCase()
            .replace(/\s+/g, "-");

        const result: IEnabledApiResult | null =
            await FnHandleApiCallForEnabled(normalizedContainer, prefixString);

        // Success
        if (result?.success) {
            return result.data;
        }

        // API returned error
        if (result && result.success === false && result.error?.message) {
            await handleShowMessage?.(result.error.message, true);
            return undefined;
        }

        // Null or unexpected structure
        return undefined;

    } catch (error: any) {
        // Unexpected runtime error (network, code crash, etc.)
        await handleShowMessage?.(
            error?.message ?? "Unexpected error while calling integration API.",
            true
        );
        return undefined;
    }
};
export { FnCallApiForIntegration }