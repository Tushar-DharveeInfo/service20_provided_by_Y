import { useState, createContext, useMemo, useCallback, useRef, useContext } from "react";
import { useFileDownload } from "@n20a/libfsdb";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IResource } from "../allinterface/IResource";
import { StatusBarContext } from "./StatusBar";

const ResourceContext = createContext<IResource | undefined>(undefined);

// Resource File Name Constants
const CHART_API_FILE = 'ChartAPI.json';
const CHART_PROFILE_FILE = 'ChartProfile.json';
const REPORT_PROFILE_FILE = 'reportprofile.json';
const REPORT_LAYOUT_FILE = 'reportlayout.json';
const ORDER_FORM_FILE = 'OrderForm.json';
const PROFORMA_INVOICE_FILE = 'ProformaInvoice.json';
const QUOTE_FORM_FILE = 'QuoteForm.json';

const ORDER_FORM = ORDER_FORM_FILE;
const PROFORMA_INVOICE = PROFORMA_INVOICE_FILE;
const QUOTE_FORM = QUOTE_FORM_FILE;

function buildStorageFolder(subfolder: string): string {
    const cfg = () => (window as Window & { APP_CONFIG?: Record<string, string> }).APP_CONFIG ?? {};
    const c = cfg();
    const baseFolder = c.BASE_FOLDER ?? 'sm';
    const bucketName = c.BUCKET_NAME ?? c.FIREBASE_BUCKET ?? 'n20-bucket-01';
    return `${bucketName}/${baseFolder}/${subfolder}`;
}

function getTemplatePath(fileName: string): string {
    return `${buildStorageFolder('reporttemplates/')}${fileName}`;
}

const getResourceLoadingLabel = (path: string): string => {
    const lower = path.toLowerCase();
    if (lower.includes('chart')) return 'Loading charts...';
    if (lower.includes('report') || lower.includes('layout')) return 'Loading report templates...';
    if (lower.includes('order')) return 'Loading order form template...';
    if (lower.includes('invoice')) return 'Loading invoice template...';
    if (lower.includes('quote')) return 'Loading quote template...';
    return 'Loading resource...';
};

function ResourceProvider({ children }: IAppContextWrapper) {
    // Status Bar loading indicator
    const statusBarContext = useContext(StatusBarContext);

    // Common Loading
    const [loading, setLoading] = useState<boolean>(false);

    // 1. Chart API
    const [chartApiJson, setChartApiJson] = useState<unknown>();
    const chartApiJsonRef = useRef<unknown>(chartApiJson);
    chartApiJsonRef.current = chartApiJson;

    // 2. Chart Profile
    const [chartProfileJson, setChartProfileJson] = useState<unknown>();
    const chartProfileJsonRef = useRef<unknown>(chartProfileJson);
    chartProfileJsonRef.current = chartProfileJson;

    // 3. Report Profile
    const [reportProfileJson, setReportProfileJson] = useState<unknown>();
    const reportProfileJsonRef = useRef<unknown>(reportProfileJson);
    reportProfileJsonRef.current = reportProfileJson;

    // 4. Report Layout
    const [reportLayoutJson, setReportLayoutJson] = useState<unknown>();
    const reportLayoutJsonRef = useRef<unknown>(reportLayoutJson);
    reportLayoutJsonRef.current = reportLayoutJson;

    // 5. Order Form
    const [orderFormJson, setOrderFormJson] = useState<unknown>();
    const orderFormJsonRef = useRef<unknown>(orderFormJson);
    orderFormJsonRef.current = orderFormJson;

    // 6. Proforma Invoice
    const [proformaInvoiceJson, setProformaInvoiceJson] = useState<unknown>();
    const proformaInvoiceJsonRef = useRef<unknown>(proformaInvoiceJson);
    proformaInvoiceJsonRef.current = proformaInvoiceJson;

    // 7. Quote Form
    const [quoteFormJson, setQuoteFormJson] = useState<unknown>();
    const quoteFormJsonRef = useRef<unknown>(quoteFormJson);
    quoteFormJsonRef.current = quoteFormJson;

    // In-flight request tracking to deduplicate concurrent requests
    const inFlightRequests = useRef<Record<string, Promise<unknown> | undefined>>({});

    const { downloadSingleFile } = useFileDownload();

    const FnGetJsonFromStorage = useCallback(async (filePath: string) => {
        const path = filePath;
        const result = await downloadSingleFile(path);
        if (!result?.success || !result.blobUrl) {
            throw new Error(result?.message || result?.error || `Failed to fetch ${filePath}`);
        }

        try {
            const response = await fetch(result.blobUrl);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath} (${response.status})`);
            }

            return await response.json();
        } finally {
            if (result.blobUrl) {
                URL.revokeObjectURL(result.blobUrl);
            }
        }
    }, [downloadSingleFile]);

    // Helper to check cache, fetch if needed, and update state
    const loadResource = useCallback(async (
        filePath: string,
        setData: (data: unknown) => void,
        dataRef: React.MutableRefObject<unknown>,
        refresh?: boolean
    ) => {
        // If refreshing, clear stale cache reference so subsequent calls wait for fresh data
        if (refresh) {
            dataRef.current = undefined;
        } else if (dataRef.current !== undefined) {
            // If data is already loaded in state variable and refresh is not true, return cached data
            return dataRef.current;
        }

        // If an identical request is already in flight and not refreshing, reuse it
        const existingPromise = inFlightRequests.current[filePath];
        if (!refresh && existingPromise) {
            return await existingPromise;
        }

        setLoading(true);
        statusBarContext?.setIsLoading?.(true);
        statusBarContext?.setLoadingLabel?.(getResourceLoadingLabel(filePath));

        const fetchPromise = (async () => {
            try {
                const data = await FnGetJsonFromStorage(filePath);
                dataRef.current = data;
                setData(data);
                return data;
            } catch (error) {
                console.error(`Error loading resource ${filePath}:`, error);
                throw error;
            } finally {
                delete inFlightRequests.current[filePath];
                if (Object.keys(inFlightRequests.current).length === 0) {
                    setLoading(false);
                    statusBarContext?.setIsLoading?.(false);
                    statusBarContext?.setLoadingLabel?.('');
                }
            }
        })();

        inFlightRequests.current[filePath] = fetchPromise;
        return await fetchPromise;
    }, [FnGetJsonFromStorage, statusBarContext]);

    // 1. Chart API function
    const getChartApi = useCallback((refresh?: boolean) => {
        return loadResource(getTemplatePath(CHART_API_FILE), setChartApiJson, chartApiJsonRef, refresh);
    }, [loadResource]);

    // 2. Chart Profile function
    const getChartProfile = useCallback((refresh?: boolean) => {
        return loadResource(getTemplatePath(CHART_PROFILE_FILE), setChartProfileJson, chartProfileJsonRef, refresh);
    }, [loadResource]);

    // 3. Report Profile function
    const getReportProfile = useCallback((refresh?: boolean) => {
        return loadResource(getTemplatePath(REPORT_PROFILE_FILE), setReportProfileJson, reportProfileJsonRef, refresh);
    }, [loadResource]);

    // 4. Report Layout function
    const getReportLayout = useCallback((refresh?: boolean) => {
        return loadResource(getTemplatePath(REPORT_LAYOUT_FILE), setReportLayoutJson, reportLayoutJsonRef, refresh);
    }, [loadResource]);

    // 5. Order Form function
    const getOrderForm = useCallback((refresh?: boolean) => {
        return loadResource(getTemplatePath(ORDER_FORM_FILE), setOrderFormJson, orderFormJsonRef, refresh);
    }, [loadResource]);

    // 6. Proforma Invoice function
    const getProformaInvoice = useCallback((refresh?: boolean) => {
        return loadResource(getTemplatePath(PROFORMA_INVOICE_FILE), setProformaInvoiceJson, proformaInvoiceJsonRef, refresh);
    }, [loadResource]);

    // 7. Quote Form function
    const getQuoteForm = useCallback((refresh?: boolean) => {
        return loadResource(getTemplatePath(QUOTE_FORM_FILE), setQuoteFormJson, quoteFormJsonRef, refresh);
    }, [loadResource]);

    const providers: IResource = useMemo(() => ({
        // Common Loading
        loading,

        // Chart API
        chartApiJson,
        setChartApiJson,
        getChartApi,

        // Chart Profile
        chartProfileJson,
        setChartProfileJson,
        getChartProfile,

        // Report Profile
        reportProfileJson,
        setReportProfileJson,
        getReportProfile,

        // Report Layout
        reportLayoutJson,
        setReportLayoutJson,
        getReportLayout,

        // Order Form
        orderFormJson,
        setOrderFormJson,
        getOrderForm,

        // Proforma Invoice
        proformaInvoiceJson,
        setProformaInvoiceJson,
        getProformaInvoice,

        // Quote Form
        quoteFormJson,
        setQuoteFormJson,
        getQuoteForm
    }), [
        loading,
        chartApiJson,
        getChartApi,
        chartProfileJson,
        getChartProfile,
        reportProfileJson,
        getReportProfile,
        reportLayoutJson,
        getReportLayout,
        orderFormJson,
        getOrderForm,
        proformaInvoiceJson,
        getProformaInvoice,
        quoteFormJson,
        getQuoteForm
    ]);

    return (
        <ResourceContext.Provider value={providers}>
            {children}
        </ResourceContext.Provider>
    );
}

// Custom Hook to consume ResourceContext
function useResourceContext() {
    const context = useContext(ResourceContext);
    if (context === undefined) {
        throw new Error('useResourceContext must be used within a ResourceProvider');
    }
    return context;
}

export {
    ResourceContext,
    ResourceProvider,
    useResourceContext,
    CHART_API_FILE,
    CHART_PROFILE_FILE,
    REPORT_PROFILE_FILE,
    REPORT_LAYOUT_FILE,
    ORDER_FORM_FILE,
    PROFORMA_INVOICE_FILE,
    QUOTE_FORM_FILE,
    ORDER_FORM,
    PROFORMA_INVOICE,
    QUOTE_FORM
};
