import { useState, createContext, useMemo, useCallback, useRef, useContext, useEffect } from "react";
import { useFileDownload } from "@n20a/libfsdb";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IResource } from "../allinterface/IResource";

const ResourceContext = createContext<IResource | undefined>(undefined);

function buildStorageFolder(subfolder: string): string {
    const cfg = () => (window as Window & { APP_CONFIG?: Record<string, string> }).APP_CONFIG ?? {};
    const c = cfg();
    const baseFolder = c.BASE_FOLDER ?? 'sm';
    const bucketName = c.BUCKET_NAME ?? 'n20-bucket-01';
    return `${bucketName}/${baseFolder}/${subfolder}`;
}

// Chart API and Chart Profile
const PRIVATE_CHARTS_BASE = buildStorageFolder('reporttemplates/');
const CHART_PROFILE_FILE = `${PRIVATE_CHARTS_BASE}ChartProfile.json`;
const CHART_API_FILE = `${PRIVATE_CHARTS_BASE}ChartAPI.json`;

// Report API and Report Profile
const PRIVATE_REPORT_TEMPLATES_BASE = buildStorageFolder('reporttemplates/');
const REPORT_PROFILE_FILE = `${PRIVATE_REPORT_TEMPLATES_BASE}reportprofile.json`;
const REPORT_LAYOUT_FILE = `${PRIVATE_REPORT_TEMPLATES_BASE}reportlayout.json`;
const ORDER_FORM = `${PRIVATE_REPORT_TEMPLATES_BASE}OrderForm.json`;
const PROFORMA_INVOICE = `${PRIVATE_REPORT_TEMPLATES_BASE}ProformaInvoice.json`;
const QUOTE_FORM = `${PRIVATE_REPORT_TEMPLATES_BASE}QuoteForm.json`;

function ResourceProvider({ children }: IAppContextWrapper) {
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
                }
            }
        })();

        inFlightRequests.current[filePath] = fetchPromise;
        return await fetchPromise;
    }, [FnGetJsonFromStorage]);

    // 1. Chart API function
    const getChartApi = useCallback((refresh?: boolean) => {
        return loadResource(CHART_API_FILE, setChartApiJson, chartApiJsonRef, refresh);
    }, [loadResource]);

    // 2. Chart Profile function
    const getChartProfile = useCallback((refresh?: boolean) => {
        return loadResource(CHART_PROFILE_FILE, setChartProfileJson, chartProfileJsonRef, refresh);
    }, [loadResource]);

    // 3. Report Profile function
    const getReportProfile = useCallback((refresh?: boolean) => {
        return loadResource(REPORT_PROFILE_FILE, setReportProfileJson, reportProfileJsonRef, refresh);
    }, [loadResource]);

    // 4. Report Layout function
    const getReportLayout = useCallback((refresh?: boolean) => {
        return loadResource(REPORT_LAYOUT_FILE, setReportLayoutJson, reportLayoutJsonRef, refresh);
    }, [loadResource]);

    // 5. Order Form function
    const getOrderForm = useCallback((refresh?: boolean) => {
        return loadResource(ORDER_FORM, setOrderFormJson, orderFormJsonRef, refresh);
    }, [loadResource]);

    // 6. Proforma Invoice function
    const getProformaInvoice = useCallback((refresh?: boolean) => {
        return loadResource(PROFORMA_INVOICE, setProformaInvoiceJson, proformaInvoiceJsonRef, refresh);
    }, [loadResource]);

    // 7. Quote Form function
    const getQuoteForm = useCallback((refresh?: boolean) => {
        return loadResource(QUOTE_FORM, setQuoteFormJson, quoteFormJsonRef, refresh);
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


export {
    ResourceContext,
    ResourceProvider,
};
