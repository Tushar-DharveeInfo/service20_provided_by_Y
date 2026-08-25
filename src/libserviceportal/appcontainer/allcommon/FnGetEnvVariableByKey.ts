
import { getDeploymentVars } from "../../shared/context/contextandprovider/MainApp";

const FnGetEnvVariableByKey = (key: string): string | null => {
    if (!key?.trim()) {
        return null;
    }
    const envVars = getDeploymentVars() as Record<string, any>[] | undefined;
    const value =
        envVars?.find(item =>
            item.key?.toLowerCase().endsWith(key.trim().toLowerCase())
        )?.value ?? null;

    return value;
}

export { FnGetEnvVariableByKey }