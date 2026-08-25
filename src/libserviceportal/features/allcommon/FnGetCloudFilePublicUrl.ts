import { axiosInterceptorForThirdPartyApis } from "../../shared/api/Interceptor";
import { FnGetEnvVariableByKey } from "../../appcontainer/allcommon/FnGetEnvVariableByKey";
import { envVarEnums } from "../../appcontainer/alldefaultprops/DefaultPropsAppContainer";

const CLOUD_BUCKET = "n20-bucket-01";
/** Unsigned public-url requests use this validation code (see storage API). */
const CLOUD_VALIDATION_CODE = "validation-code";
const PUBLIC_URL_PATH = "/api/files/download/public-url";
const DEFAULT_BASE_FOLDER = "sm";
const DEFAULT_FOLDER = "brochures";
const FALLBACK_CLOUDRUN_URL = "https://n20-storage-cloudrun-mkvwooi2sa-uc.a.run.app";

interface ICloudPublicUrlResponse {
    success?: boolean;
    publicUrl?: string;
    filename?: string;
    folder?: string;
    filePath?: string;
}

interface ICloudFilePublicUrlOptions {
    folder?: string;
    baseFolder?: string;
    bucketName?: string;
}

/* Resolves a cloud storage public URL (unsigned) for launch / download. */
const FnGetCloudFilePublicUrl = async (
    filename: string,
    options?: ICloudFilePublicUrlOptions
): Promise<string> => {
    const trimmedName = filename.trim();
    if (!trimmedName) {
        throw new Error("FnGetCloudFilePublicUrl: filename is required");
    }

    const baseUrl = (
        FnGetEnvVariableByKey(envVarEnums.BASE_URL_LIB) ?? FALLBACK_CLOUDRUN_URL
    ).replace(/\/+$/, "");

    const body = {
        validationCode: CLOUD_VALIDATION_CODE,
        baseFolder: options?.baseFolder ?? DEFAULT_BASE_FOLDER,
        bucketName: options?.bucketName ?? CLOUD_BUCKET,
        folder: options?.folder ?? DEFAULT_FOLDER,
        filename: trimmedName,
    };

    const response = await axiosInterceptorForThirdPartyApis(
        `${baseUrl}${PUBLIC_URL_PATH}`,
        body,
        "POST"
    ) as ICloudPublicUrlResponse;

    if (!response?.publicUrl) {
        throw new Error(`No publicUrl returned for ${trimmedName}`);
    }

    return response.publicUrl;
};

export {
    FnGetCloudFilePublicUrl,
    CLOUD_BUCKET,
    CLOUD_VALIDATION_CODE,
    DEFAULT_BASE_FOLDER,
    DEFAULT_FOLDER,
};
export type { ICloudFilePublicUrlOptions, ICloudPublicUrlResponse };
