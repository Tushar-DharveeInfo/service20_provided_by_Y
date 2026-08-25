import { IEnabledApiResult } from "../../allinterface/settingsform/ISettingsLibForm";

/* Integration enable checks — remote EXPAPI calls removed. */
const FnHandleApiCallForEnabled = async (
    containerName: string,
    _prefixString: string
): Promise<IEnabledApiResult | null> => {
    try {
        void containerName;

        return null;
    } catch (error) {
        console.error("Error in call API for integration: ", error);
        return null;
    }
};

export { FnHandleApiCallForEnabled };
