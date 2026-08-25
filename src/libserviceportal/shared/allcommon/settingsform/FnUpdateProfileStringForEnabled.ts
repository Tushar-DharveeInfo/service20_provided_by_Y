
import { IEnabledApiResult } from "../../allinterface/settingsform/ISettingsLibForm";
import { FnHandleApiCallForEnabled } from "./FnHandleApiCallForEnabled";

const FnUpdateProfileStringForEnabled = async (
    profileString: string,
    containerName: string
): Promise<string> => {
    try {
        const parsedProfile = JSON.parse(profileString);
        if (
            Array.isArray(parsedProfile) &&
            parsedProfile.length > 0 &&
            parsedProfile[0]?.Enabled &&
            parsedProfile[0]?.Enabled !== "0"
        ) {
            const apiStatus: IEnabledApiResult | null =
                await FnHandleApiCallForEnabled(
                    containerName.toLowerCase().replace(/\s+/g, '-'),
                    parsedProfile[0].EnvPrefix
                );

            if (apiStatus?.success) {
                // Add / Update EnvVariables
                parsedProfile[0].EnvVariables = JSON.stringify(apiStatus.data);

                // Return updated profile string
                return JSON.stringify(parsedProfile);
            }
        }

        return profileString;
    } catch (error) {
        console.error("Error in update profile string for enabled: ", error);
        return profileString;
    }
};

export { FnUpdateProfileStringForEnabled };
