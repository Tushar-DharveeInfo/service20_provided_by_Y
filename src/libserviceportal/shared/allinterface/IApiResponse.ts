
import type { IErrorData } from "../context/allinterface/IStatusBar";

interface IApiResponse {
    status: number;
    data: any;
    errData: IErrorData[];
}

interface IParallelApis {
    url: string;
    payload: object;
    tableName: string;
    [key: string]: string | unknown;
}

interface IDeploymentEnv {
    key: string;
    value: string;
}

interface IDeploymentEnvResponse {
    valid: boolean;
    env: IDeploymentEnv[];
}

export type { IApiResponse, IErrorData, IParallelApis, IDeploymentEnv, IDeploymentEnvResponse }
