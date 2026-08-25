import { axiosInterceptorForThirdPartyApis, axiosInterceptorToGetFileFromPublic } from "../../api/Interceptor";

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

            if (!multiple) {
                if (typeof name !== "string") return;

                const body = {
                    validationCode: "your-code",
                    bucketName: "n20-bucket-01",
                    baseFolder: "libfolder-01",
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
                    validationCode: "your-code",
                    bucketName: "n20-bucket-01",
                    baseFolder: "libfolder-01",
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