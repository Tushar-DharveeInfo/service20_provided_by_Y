
import { getDeploymentVars } from "../../shared/context/contextandprovider/MainApp";

const FnGetEnvVariableByKey = (key: string): string | null => {
    if (!key?.trim()) {
        return null;
    }
    const cleanKey = key.trim().toLowerCase();
    const envVars = getDeploymentVars() as Record<string, any>[] | undefined;
    let value =
        envVars?.find(item =>
            item.key?.toLowerCase().endsWith(cleanKey)
        )?.value ?? null;

    if (!value && (cleanKey === "cloudrun_url" || cleanKey === "cloudrun_api_url")) {
        value = envVars?.find(item => {
            const k = item.key?.toLowerCase() ?? "";
            return k.endsWith("cloudrun_url") || k.endsWith("cloudrun_api_url");
        })?.value ?? null;
    }

    if (!value) {
        const cfg = (window as Window & { APP_CONFIG?: Record<string, any>; appSettings?: Record<string, any> }).APP_CONFIG
            ?? (window as Window & { appSettings?: Record<string, any> }).appSettings;
        if (cfg) {
            value = cfg[key]
                ?? cfg[key.toUpperCase()]
                ?? (cleanKey === "cloudrun_url" || cleanKey === "cloudrun_api_url"
                    ? cfg.CLOUDRUN_URL ?? cfg.CLOUDRUN_API_URL
                    : null)
                ?? null;
        }
    }

    return value ? String(value) : null;
}

export { FnGetEnvVariableByKey }