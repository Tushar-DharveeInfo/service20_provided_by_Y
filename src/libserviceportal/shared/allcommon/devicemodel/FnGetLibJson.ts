import { axiosInterceptorForThirdPartyApis, axiosInterceptorToGetFileFromPublic } from "../../interceptors/Interceptor";

const FnGetLibJson = async (
    name: string | string[],
    absoluteurl?: string,
    sessionid?: string,
    multiple?: boolean,
    method?: string
) => {
    try {
        // Case 1: Get from public/lib if no sessionid and no absoluteurl
        if (!sessionid && !absoluteurl) {
            if (!name || typeof name !== "string") return;

            const jsonData = await axiosInterceptorToGetFileFromPublic(
                `privatelib/${name}.json`,
                { responseType: 'json' }
            );

            return jsonData;
        }

        // Case 2: API call if absoluteurl exists
        else if (name && absoluteurl) {
            const cfg = (window as Window & { APP_CONFIG?: Record<string, string> }).APP_CONFIG ?? {};
            const validationCode = cfg.VALIDATION_CODE || "your-code";
            const bucketName = cfg.FIREBASE_BUCKET || "n20-bucket-01";
            const baseFolder = cfg.FIREBASE_LIBFOLDER || "libfolder-01";

            if (!multiple) {
                if (typeof name !== "string") return;

                const body = {
                    validationCode,
                    bucketName,
                    baseFolder,
                    filePath: `${name}.json`
                };

                const response = await axiosInterceptorForThirdPartyApis(
                    absoluteurl,
                    body,
                    method
                );

                return response;

            } else {
                if (!Array.isArray(name)) return;

                const body = {
                    validationCode,
                    bucketName,
                    baseFolder,
                    filePaths: name
                };

                const response = await axiosInterceptorForThirdPartyApis(
                    absoluteurl,
                    body,
                    method
                );

                return response;
            }
        }

    } catch (error: unknown) {
        throw error instanceof Error
            ? error
            : new Error(String(error));
    }
};


export { FnGetLibJson }