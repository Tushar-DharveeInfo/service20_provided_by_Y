/*
 * Portable fetch-interceptor core (library-ready).
 * No host/app imports — only axios + types defined in this module.
 * Inject host behavior via createFetchInterceptor(deps).
 */
import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";

/** Structurally compatible with host IErrorData. */
export interface IFetchInterceptorErrorData {
    errCode: number;
    errString: string;
    isErr: boolean;
    timeStamp: string;
    apiName?: string;
    difference?: number;
    id?: number;
}

/** Structurally compatible with host IApiResponse. */
export interface IFetchInterceptorApiResponse {
    status: number;
    data: unknown;
    errData: IFetchInterceptorErrorData[];
}

/** Structurally compatible with host IFetchProps. */
export interface IFetchInterceptorRequestProps {
    url: string;
    method?: string | "GET" | "POST";
    customBaseUrl?: string;
    data?: unknown;
    allowShowLoader?: boolean;
    disableLog?: boolean;
    customHeader?: Record<string, string>;
    callSilently?: boolean;
    timeout?: number;
    /** Optional AbortSignal to cancel the in-flight request. */
    signal?: AbortSignal;
    setFetchData: (
        data: unknown,
        status?: string,
        errData?: IFetchInterceptorErrorData[]
    ) => void;
}

/** Minimal status-bar surface; structurally compatible with host IStatusBar. */
export interface IFetchInterceptorStatusBar {
    setFetchDataError: (fetchDataError: IFetchInterceptorErrorData[] | null) => void;
    setFetchError: (fetchError: string[] | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    setActionLogData: (actionLogData?: IFetchInterceptorErrorData[]) => void;
}

/** Structurally compatible with host IFetchStatusbarContainer. */
export interface IFetchInterceptorWithoutUiProps {
    FetchProps: IFetchInterceptorRequestProps;
    setFetchDataError: (data: IFetchInterceptorErrorData[] | null) => void;
    setFetchError: (data: string | string[] | null) => void;
    setFetchPercentCompleted?: (data: number) => void;
    signal?: AbortSignal;
}

/** Options for a single HEAD reachability probe. */
export interface IFetchInterceptorHeadOptions {
    url: string;
    headers?: Record<string, string>;
    onHeadersReceived: (
        headers: Record<string, string> | null,
        isReachable: boolean,
        error: string | unknown
    ) => void;
}

/** Options for batched HEAD reachability probes. */
export interface IFetchInterceptorHeadAllOptions {
    urls: string[];
    headers?: Record<string, string>;
    batchSize?: number;
    onComplete: (
        result: { url: string; isReachable: boolean; error?: string }[]
    ) => void;
}

/** Host-provided dependencies — the only coupling point for a consuming app. */
export interface IFetchInterceptorDeps {
    /** Resolve session id (e.g. from sessionStorage). */
    getSessionId: (key: string) => string | null;
    /** Build absolute API base URL (env / production / custom). */
    getBaseApiUrl: (customBaseUrl?: string) => string;
    /** Diagnostic level string; "0" disables logging. Optional. */
    getDiagnosticLevel?: () => string | undefined;
    /** Timestamp for action logs. Optional. */
    getTodayTimeString?: () => string;
    /** Map entity API error rows to a display string. Optional. */
    getEntityErrorMessage?: (data: unknown[]) => string;
    /** Session storage key. Default: "user_session". */
    sessionStorageKey?: string;
    /** Request header name for session. Default: "nz_sessionid". */
    sessionHeaderName?: string;
    /** Default request timeout ms. Default: 60000. */
    defaultTimeoutMs?: number;
}

/** Public API returned by createFetchInterceptor. */
export interface IFetchInterceptorApi {
    axiosInterceptor: (
        fetchProps: IFetchInterceptorRequestProps,
        statusBarContext: IFetchInterceptorStatusBar
    ) => Promise<IFetchInterceptorApiResponse>;
    axiosInterceptorWithoutUI: (
        props: IFetchInterceptorWithoutUiProps
    ) => Promise<IFetchInterceptorApiResponse>;
    axiosInterceptorForTest: (
        fetchProps: IFetchInterceptorRequestProps,
        statusBarContext: IFetchInterceptorStatusBar
    ) => Promise<IFetchInterceptorApiResponse>;
    axiosInterceptorForPostResponse: (
        url: string,
        payload: unknown
    ) => Promise<{ status: number; response: unknown }>;
    axiosInterceptorForPowerBi: (
        url: string
    ) => Promise<{ status: number; data: unknown }>;
    axiosInterceptorForHead: (options: IFetchInterceptorHeadOptions) => Promise<void>;
    axiosInterceptorToGetFileFromPublic: <T = unknown>(
        filename: string,
        options?: {
            headers?: Record<string, string>;
            responseType?: "json" | "text" | "blob";
        }
    ) => Promise<T>;
    axiosInterceptorForHeadAll: (
        options: IFetchInterceptorHeadAllOptions
    ) => Promise<void>;
    axiosInterceptorForThirdPartyApis: (
        absoluteUrl: string,
        body: unknown,
        method?: string
    ) => Promise<unknown>;
    axiosInstance: AxiosInstance;
}

/** Entity row shape used when reading ErrorString from API payload. */
type IEntityErrorRow = {
    ErrorString?: string;
};

/** Response data shape that may contain jsonStringOutput. */
type IJsonStringOutputPayload = {
    jsonStringOutput?: string;
};

// Returns true when sessionId is a usable non-empty string.
const isValidSession = (sessionId: unknown): sessionId is string => {
    return (
        typeof sessionId === "string" &&
        sessionId.length > 0 &&
        sessionId !== "null" &&
        sessionId !== "undefined"
    );
};

// Downloads diagnostic JSON via a temporary blob URL, then revokes it.
const saveJsonToFile = (data: unknown, fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    try {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Failed to save diagnostic JSON:", e);
    } finally {
        URL.revokeObjectURL(url);
    }
};

/** True when the request was canceled via AbortSignal / CancelToken (not a real timeout). */
const isRequestAborted = (error: unknown, signal?: AbortSignal): boolean => {
    if (signal?.aborted) return true;
    if (axios.isCancel(error)) return true;
    if (axios.isAxiosError(error) && error.code === "ERR_CANCELED") return true;
    if (error instanceof DOMException && error.name === "AbortError") return true;
    if (error instanceof Error && (error.name === "CanceledError" || error.name === "AbortError")) {
        return true;
    }
    return false;
};

/** Links an optional external AbortSignal to the local controller passed to axios. */
const linkAbortSignal = (controller: AbortController, externalSignal?: AbortSignal): (() => void) => {
    if (!externalSignal) {
        return () => undefined;
    }

    if (externalSignal.aborted) {
        controller.abort();
        return () => undefined;
    }

    const onAbort = () => {
        if (!controller.signal.aborted) {
            controller.abort();
        }
    };
    externalSignal.addEventListener("abort", onAbort);
    return () => externalSignal.removeEventListener("abort", onAbort);
};

// Maps axios/unknown failures to a single user-facing error string.
const handleAxiosError = (error: unknown, timeout?: number, defaultTimeoutMs = 60000): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Only real xhr/fetch timeouts — AbortSignal cancels are handled via isRequestAborted.
        if (axiosError.code === "ECONNABORTED") {
            const timeoutSeconds = (timeout || defaultTimeoutMs) / 1000;
            return `Request timeout: The request took longer than ${timeoutSeconds} seconds`;
        }

        if (axiosError.response) {
            return `Request failed with status ${axiosError.response.status}: ${axiosError.message}`;
        }

        if (axiosError.request) {
            return `Network error: ${axiosError.message}`;
        }

        return `Request setup error: ${axiosError.message}`;
    }

    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }

    if (typeof error === "string") {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return "Unknown error occurred.";
    }
};

// Narrows unknown values to plain objects for safe property access/spreading.
const asRecord = (value: unknown): Record<string, unknown> | null => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return null;
};

// Builds the interceptor API once using host-injected deps; re-export from the host wiring file.
const createFetchInterceptor = (deps: IFetchInterceptorDeps): IFetchInterceptorApi => {
    const DEFAULT_FETCH_TIMEOUT = deps.defaultTimeoutMs ?? 60000;
    const sessionStorageKey = deps.sessionStorageKey ?? "user_session";
    const sessionHeaderName = deps.sessionHeaderName ?? "nz_sessionid";
    const getDiagnosticLevel = deps.getDiagnosticLevel ?? (() => "0");
    const getTodayTimeString = deps.getTodayTimeString ?? (() => new Date().toISOString());
    // Fallback entity-error formatter when host does not supply getEntityErrorMessage.
    const getEntityErrorMessage =
        deps.getEntityErrorMessage ??
        ((data: unknown[]) => {
            if (!Array.isArray(data) || !data.length) return "";
            return data
                .map((row) => {
                    const entityRow = row as IEntityErrorRow;
                    return entityRow.ErrorString ?? "";
                })
                .filter(Boolean)
                .join("<br/>");
        });

    // Shared axios client with default JSON headers and timeout.
    const axiosInstance: AxiosInstance = axios.create({
        timeout: DEFAULT_FETCH_TIMEOUT,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
        },
    });

    // Injects session id into request headers when available.
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const dataRecord = asRecord(config.data);
            const sessionId =
                (typeof dataRecord?.sessionId === "string" ? dataRecord.sessionId : null) ||
                deps.getSessionId(sessionStorageKey);

            if (isValidSession(sessionId)) {
                config.headers.set(sessionHeaderName, `${sessionId}`);
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Main API call with status-bar loader, diagnostic logging, and error handling.
    const axiosInterceptor = async (
        FetchProps: IFetchInterceptorRequestProps,
        StatusBarContext: IFetchInterceptorStatusBar
    ): Promise<IFetchInterceptorApiResponse> => {
        const isSilentCall = FetchProps.callSilently === true;
        const controller = new AbortController();
        const unlinkAbort = linkAbortSignal(controller, FetchProps.signal);
        const customTimeout = FetchProps?.timeout || DEFAULT_FETCH_TIMEOUT;

        try {
            const diagnosticLevel = getDiagnosticLevel() ?? "0";
            const shouldLog = !FetchProps.disableLog && diagnosticLevel !== "0";
            let actionLog: IFetchInterceptorErrorData[] = [];
            const startTime = performance.now();
            const apiName = FetchProps.url;
            let timeStamp = getTodayTimeString();
            const base_url = deps.getBaseApiUrl(FetchProps.customBaseUrl);

            // Record API begin entry for the action log.
            if (shouldLog) {
                actionLog.push({
                    isErr: false,
                    errCode: 0,
                    timeStamp: timeStamp,
                    errString: `UI-API begin : ${apiName}`,
                    difference: 0,
                    apiName: apiName,
                });
            }

            if (!isSilentCall && FetchProps.allowShowLoader) {
                StatusBarContext.setIsLoading(true);
            }

            const session_data = deps.getSessionId(sessionStorageKey);
            const payload: Record<string, unknown> = {
                ...asRecord(FetchProps?.data),
            };

            if (!isValidSession(session_data)) {
                throw new Error("Session ID missing or invalid");
            }

            // Always drive axios from the local controller; external AbortSignal is linked above.
            const axiosConfig: AxiosRequestConfig = {
                method: FetchProps?.method || "POST",
                url: `${base_url}${FetchProps.url}`,
                signal: controller.signal,
                timeout: FetchProps?.timeout || DEFAULT_FETCH_TIMEOUT,
            };

            if (FetchProps?.customHeader) {
                axiosConfig.headers = { ...FetchProps.customHeader };
            }

            // GET uses query params; other methods send JSON body.
            if (axiosConfig.method === "GET" && Object.entries(payload).length) {
                axiosConfig.params = payload;
            } else if (Object.keys(payload).length > 0) {
                axiosConfig.data = payload;
            } else {
                axiosConfig.data = {};
            }

            const response: AxiosResponse<IFetchInterceptorApiResponse> = await axiosInstance.request(axiosConfig);
            const result: IFetchInterceptorApiResponse = response.data;

            timeStamp = getTodayTimeString();
            const executionTime = Math.abs(performance.now() - startTime);
            const errorLog =
                result.errData && result.errData?.filter((item) => item.errCode !== 99999);

            // Normalize errData timestamps and attach apiName for the UI log.
            if (shouldLog && errorLog) {
                errorLog.forEach((element) => {
                    const timestamp = element?.timeStamp;
                    const date = new Date(timestamp);
                    const timeWithMilliseconds = isNaN(date.getTime())
                        ? element?.timeStamp
                        : date.toLocaleTimeString(undefined, {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        });

                    element.timeStamp = timeWithMilliseconds;
                    element.apiName = apiName;
                });
            }

            if (result.status === 200) {
                const responseData = asRecord(result.data) as IJsonStringOutputPayload | null;
                // Parse jsonStringOutput and append entity-level error messages when present.
                if (responseData?.jsonStringOutput && responseData.jsonStringOutput.length > 0) {
                    const data =
                        typeof responseData.jsonStringOutput === "string" &&
                        JSON.parse(responseData.jsonStringOutput);

                    if (
                        shouldLog &&
                        data &&
                        typeof data === "object" &&
                        Object.keys(data)?.length > 0
                    ) {
                        const dataRecord = asRecord(data);
                        const firstKey = dataRecord ? Object.keys(dataRecord)[0] : undefined;
                        const firstValue = firstKey ? dataRecord?.[firstKey] : undefined;
                        const dataArray: unknown[] = Array.isArray(firstValue) ? firstValue : [];
                        const entityError = getEntityErrorMessage(dataArray);
                        errorLog?.push({
                            isErr: true,
                            errCode: 0,
                            timeStamp: timeStamp,
                            errString: entityError,
                            difference: Math.round(executionTime),
                            apiName: apiName,
                        });
                    }
                }

                // Push success end markers into the status-bar action log.
                if (!isSilentCall && shouldLog && errorLog) {
                    errorLog.push({
                        isErr: false,
                        errCode: 0,
                        timeStamp: timeStamp,
                        errString: `UI-API end : ${apiName}`,
                        difference: Math.round(executionTime),
                        apiName: apiName,
                    });
                    errorLog.push({
                        isErr: false,
                        errCode: 0,
                        timeStamp: "",
                        errString: ``,
                        difference: 0,
                        apiName: "",
                    });
                    actionLog = [...actionLog, ...errorLog];
                    StatusBarContext.setActionLogData(actionLog);
                }

                // Level 9 downloads request/response JSON for diagnostics.
                if (diagnosticLevel === "9") {
                    const fileName = `${apiName}-${crypto.randomUUID()}.json`;
                    saveJsonToFile({ payload: payload, response: result.data }, fileName);
                }

                FetchProps.setFetchData(result.data, result.status.toString());
            } else {
                // Non-200: still log end markers, then surface errData to the status bar.
                if (!isSilentCall && shouldLog && errorLog) {
                    errorLog.push({
                        isErr: false,
                        errCode: 0,
                        timeStamp: timeStamp,
                        errString: `UI-API end : ${apiName}`,
                        difference: Math.round(executionTime),
                        apiName: apiName,
                    });
                    errorLog.push({
                        isErr: false,
                        errCode: 0,
                        timeStamp: "",
                        errString: ``,
                        difference: 0,
                        apiName: "",
                    });
                    actionLog = [...actionLog, ...errorLog];
                    StatusBarContext.setActionLogData(actionLog);
                }

                console.warn(
                    "axiosInterceptor dataerror:",
                    result.errData,
                    axiosConfig.url,
                    payload
                );
                if (!isSilentCall) {
                    StatusBarContext.setFetchDataError(result.errData);
                }
                FetchProps.setFetchData(result.data, result.status.toString(), result.errData);
            }

            return result;
        } catch (error: unknown) {
            if (isRequestAborted(error, FetchProps.signal) || controller.signal.aborted) {
                throw error;
            }

            const errorMessage = handleAxiosError(error, customTimeout, DEFAULT_FETCH_TIMEOUT);
            console.warn("axiosInterceptor error:", errorMessage, error);

            if (!isSilentCall) {
                StatusBarContext.setFetchError([errorMessage]);
            }
            throw new Error(errorMessage);
        } finally {
            unlinkAbort();
            if (!controller.signal.aborted) {
                controller.abort();
            }
            if (!isSilentCall && FetchProps.allowShowLoader) {
                StatusBarContext.setIsLoading(false);
            }
        }
    };

    // API call without status-bar loader/logging; supports external AbortSignal.
    const axiosInterceptorWithoutUI = async (
        fetchInterceptorProps: IFetchInterceptorWithoutUiProps
    ): Promise<IFetchInterceptorApiResponse> => {
        const {
            FetchProps,
            setFetchDataError,
            setFetchError,
            setFetchPercentCompleted,
            signal,
        } = fetchInterceptorProps;
        const customTimeout = FetchProps?.timeout || DEFAULT_FETCH_TIMEOUT;
        const controller = new AbortController();
        const externalSignal = signal ?? FetchProps.signal;
        const unlinkAbort = linkAbortSignal(controller, externalSignal);

        try {
            const base_url = deps.getBaseApiUrl(FetchProps.customBaseUrl);
            const session_data = deps.getSessionId(sessionStorageKey);
            const payload: Record<string, unknown> = {
                ...asRecord(FetchProps?.data),
            };

            if (!isValidSession(session_data)) {
                throw new Error("Session ID missing or invalid");
            }

            const axiosConfig: AxiosRequestConfig = {
                method: FetchProps?.method || "POST",
                url: `${base_url}${FetchProps.url}`,
                signal: controller.signal,
                timeout: customTimeout,
            };

            if (FetchProps?.customHeader) {
                axiosConfig.headers = { ...FetchProps.customHeader };
            }

            if (Object.keys(payload).length > 0) {
                axiosConfig.data = payload;
            } else {
                axiosConfig.data = {};
            }

            const response: AxiosResponse<IFetchInterceptorApiResponse> = await axiosInstance.request(axiosConfig);

            if (setFetchPercentCompleted) {
                setFetchPercentCompleted(100);
            }

            const result: IFetchInterceptorApiResponse = response.data;

            if (result.status === 200) {
                FetchProps.setFetchData(result.data, result.status.toString());
            } else {
                setFetchDataError(result.errData);
                FetchProps.setFetchData(result.data, result.status.toString());
            }

            return result;
        } catch (error: unknown) {
            if (isRequestAborted(error, externalSignal) || controller.signal.aborted) {
                throw error;
            }
            const errorMessage = handleAxiosError(error, customTimeout, DEFAULT_FETCH_TIMEOUT);
            setFetchError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            unlinkAbort();
            if (!controller.signal.aborted) {
                controller.abort();
            }
        }
    };

    // POSTs to an absolute or same-origin URL and returns status + body.
    async function axiosInterceptorForPostResponse(url: string, payload: unknown) {
        try {
            const baseUrl = window.location.origin ?? "";
            const finalUrl = url.startsWith("http")
                ? url
                : `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
            const sessionId = deps.getSessionId(sessionStorageKey);

            const response = await axios.post(finalUrl, payload, {
                headers: {
                    "Content-Type": "application/json",
                    [sessionHeaderName]: `${sessionId ?? ""}`,
                    Authorization: `nzSessionId ${sessionId ?? ""}`,
                },
            });

            return {
                status: response.status,
                response: response.data,
            };
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                return {
                    status: error.response?.status || 500,
                    response: { error: error.message || "Unknown error" },
                };
            }
            return {
                status: 500,
                response: {
                    error: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    }

    // GETs Power BI payload and unwraps nested data when present.
    async function axiosInterceptorForPowerBi(url: string) {
        try {
            const response = await axios.get(url);
            const responseData = asRecord(response.data);

            return {
                status: response.status,
                data: responseData?.data ?? null,
            };
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                return {
                    status: error.response?.status || 500,
                    data: { error: error.message || "Unknown error" },
                };
            }
            return {
                status: 500,
                data: {
                    error: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    }

    // HEAD probe for a single URL; reports headers and reachability via callback.
    async function axiosInterceptorForHead(options: IFetchInterceptorHeadOptions): Promise<void> {
        const {
            url,
            headers = {
                Accept: "*/*",
                "Accept-Language": "en-US,en;q=0.9",
            },
            onHeadersReceived,
        } = options;

        const normalizedUrl = /^https?:\/\//i.test(url) ? url : `http://${url}`;

        try {
            const response = await axios.head(normalizedUrl, { headers });
            const isReachable = response.status >= 200 && response.status < 400;
            const headersObj = response.headers as Record<string, string>;
            onHeadersReceived(headersObj, isReachable, null);
        } catch (error: unknown) {
            console.error("Axios HEAD error:", error);
            const message = `Unable to reach ${normalizedUrl}.`;
            onHeadersReceived(null, false, message);
        }
    }

    // Loads a file from the public folder root (json/text/blob).
    async function axiosInterceptorToGetFileFromPublic<T = unknown>(
        filename: string,
        options?: {
            headers?: Record<string, string>;
            responseType?: "json" | "text" | "blob";
        }
    ): Promise<T> {
        const { headers = {}, responseType = "json" } = options || {};
        const url = `/${filename.replace(/^\/+/, "")}`;

        try {
            const axiosConfig: AxiosRequestConfig = {
                method: "GET",
                url,
                headers,
                responseType:
                    responseType === "json"
                        ? "json"
                        : responseType === "blob"
                            ? "blob"
                            : "text",
            };

            const response = await axios.request<T>(axiosConfig);
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Failed to fetch ${filename}: ${error.response?.status || "Network Error"}`
                );
            }
            throw error;
        }
    }

    // Runs HEAD reachability checks in batches and returns aggregated results.
    async function axiosInterceptorForHeadAll(
        options: IFetchInterceptorHeadAllOptions
    ): Promise<void> {
        const {
            urls,
            headers = {
                Accept: "*/*",
                "Accept-Language": "en-US,en;q=0.9",
            },
            batchSize = 10,
            onComplete,
        } = options;

        // Ensures URL has an http(s) scheme before probing.
        const normalizeUrl = (urlValue: string): string =>
            /^https?:\/\//i.test(urlValue) ? urlValue : `http://${urlValue}`;

        // Performs one HEAD request and maps the outcome to a reachability result.
        const fetchHead = async (urlValue: string) => {
            const normalizedUrl = normalizeUrl(urlValue);
            try {
                const response = await axios.head(normalizedUrl, { headers });

                return {
                    url: urlValue,
                    isReachable: response.status !== 404,
                    status: response.status,
                };
            } catch (error: unknown) {
                return {
                    url: urlValue,
                    isReachable: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        };

        // Executes HEAD batches sequentially, then invokes onComplete.
        const runBatches = async () => {
            const allResults: {
                url: string;
                isReachable: boolean;
                error?: string;
            }[] = [];

            const batches: (() => Promise<void>)[] = [];

            for (let i = 0; i < urls.length; i += batchSize) {
                const batch: string[] = [];

                for (let j = i; j < i + batchSize && j < urls.length; j++) {
                    batch.push(urls[j]);
                }
                batches.push(async () => {
                    const results = await Promise.allSettled(batch.map(fetchHead));
                    results.forEach((res, idx) => {
                        if (res.status === "fulfilled") {
                            allResults.push(res.value);
                        } else {
                            allResults.push({
                                url: batch[idx],
                                isReachable: false,
                                error:
                                    res.reason instanceof Error
                                        ? res.reason.message
                                        : "Unknown error",
                            });
                        }
                    });
                });
            }

            for (const runBatch of batches) {
                await runBatch();
            }

            onComplete(allResults);
        };

        await runBatches();
    }

    // Calls an absolute third-party URL without host base-URL rewriting.
    const axiosInterceptorForThirdPartyApis = async (
        absoluteurl: string,
        body: unknown,
        method?: string
    ) => {
        try {
            const response = await axios({
                method: method ?? "POST",
                url: absoluteurl,
                data: body,
                headers: {
                    "Content-Type": "application/json",
                },
                maxRedirects: 5,
            });

            return response.data;
        } catch (error: unknown) {
            console.error("Third-party API error:", error);
            if (axios.isAxiosError(error)) {
                const errorMessage = `API request failed: ${error.response?.status || "Network Error"} ${error.message}`;
                throw new Error(errorMessage);
            }
            throw error;
        }
    };

    // Test/QA variant: loader only, no diagnostic action-log side effects.
    const axiosInterceptorForTest = async (
        FetchProps: IFetchInterceptorRequestProps,
        StatusBarContext: IFetchInterceptorStatusBar
    ): Promise<IFetchInterceptorApiResponse> => {
        const controller = new AbortController();
        const customTimeout = FetchProps?.timeout || DEFAULT_FETCH_TIMEOUT;

        try {
            const base_url = deps.getBaseApiUrl(FetchProps.customBaseUrl);

            if (FetchProps.allowShowLoader) {
                StatusBarContext.setIsLoading(true);
            }

            const session_data = deps.getSessionId(sessionStorageKey);
            const payload: Record<string, unknown> = {
                ...asRecord(FetchProps?.data),
            };

            if (!isValidSession(session_data)) {
                throw new Error("Session ID missing or invalid");
            }

            const axiosConfig: AxiosRequestConfig = {
                method: FetchProps?.method || "POST",
                url: `${base_url}${FetchProps.url}`,
                signal: controller.signal,
                timeout: customTimeout,
            };

            if (FetchProps?.customHeader) {
                axiosConfig.headers = { ...FetchProps.customHeader };
            }

            if (axiosConfig.method === "GET" && Object.entries(payload).length) {
                axiosConfig.params = payload;
            } else if (Object.keys(payload).length > 0) {
                axiosConfig.data = payload;
            } else {
                axiosConfig.data = {};
            }
            const response: AxiosResponse<IFetchInterceptorApiResponse> = await axiosInstance.request(axiosConfig);
            const result: IFetchInterceptorApiResponse = response.data;

            // Always forward data + errData so tests can assert both outcomes.
            if (result.status === 200) {
                FetchProps.setFetchData(result.data, result.status.toString(), result.errData);
            } else {
                FetchProps.setFetchData(result.data, result.status.toString(), result.errData);
            }

            return result;
        } catch (error: unknown) {
            const errorMessage = handleAxiosError(error, customTimeout, DEFAULT_FETCH_TIMEOUT);
            console.warn("axiosInterceptorForTest error:", errorMessage, error);
            throw new Error(errorMessage);
        } finally {
            controller.abort();
            if (FetchProps.allowShowLoader) {
                StatusBarContext.setIsLoading(false);
            }
        }
    };

    return {
        axiosInterceptor,
        axiosInterceptorWithoutUI,
        axiosInterceptorForTest,
        axiosInterceptorForPostResponse,
        axiosInterceptorForPowerBi,
        axiosInterceptorForHead,
        axiosInterceptorToGetFileFromPublic,
        axiosInterceptorForHeadAll,
        axiosInterceptorForThirdPartyApis,
        axiosInstance,
    };
};

export { createFetchInterceptor };
