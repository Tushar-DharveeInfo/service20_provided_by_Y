import { useState, createContext, useMemo, useEffect } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { IResource } from "../allinterface/IResource";

const ResourceContext = createContext<IResource | undefined>(undefined);

//Chart API and Chart Profile
const PRIVATE_CHARTS_BASE = 'privatecharts';
const CHART_PROFILE_FILE = `${PRIVATE_CHARTS_BASE}/ChartProfile.json`;
const CHART_API_FILE = `${PRIVATE_CHARTS_BASE}/ChartAPI.json`;

// Report API and Report Profile
const PRIVATE_REPORT_TEMPLATES_BASE = '/privatereporttemplates';
const REPORT_PROFILE_FILE = `${PRIVATE_REPORT_TEMPLATES_BASE}/ReportProfile.json`;
const REPORT_LAYOUT_FILE = `${PRIVATE_REPORT_TEMPLATES_BASE}/ReportLayout.json`;
const ORDER_FORM = `${PRIVATE_REPORT_TEMPLATES_BASE}/OrderForm.json`;
const PROFORMA_INVOICE = `${PRIVATE_REPORT_TEMPLATES_BASE}/ProformaInvoice.json`;
const QUOTE_FORM = `${PRIVATE_REPORT_TEMPLATES_BASE}/QuoteForm.json`;

function ResourceProvider({ children }: IAppContextWrapper) {
    const [chartApiJson, setChartApiJson] = useState<unknown>();
    const [chartProfileJson, setChartProfileJson] = useState<unknown>();
    const [reportProfileJson, setReportProfileJson] = useState<unknown>();
    const [reportLayoutJson, setReportLayoutJson] = useState<unknown>();
    const [orderFormJson, setOrderFormJson] = useState<unknown>();
    const [proformaInvoiceJson, setProformaInvoiceJson] = useState<unknown>();
    const [quoteFormJson, setQuoteFormJson] = useState<unknown>();


    const FnGetJsonFromPublicFolder = async (filePath: string) => {
        const path = filePath.startsWith('/') ? filePath : `/${filePath}`;

        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`Failed to load ${filePath} (${response.status})`);
        }

        return (await response.json());
    };

    useEffect(() => {
        // Chart API, Chart Profile, and Report Template Data
        void Promise.all([
            // chart files
            FnGetJsonFromPublicFolder(CHART_API_FILE).then(setChartApiJson),
            FnGetJsonFromPublicFolder(CHART_PROFILE_FILE).then(setChartProfileJson),

            // report files
            FnGetJsonFromPublicFolder(REPORT_PROFILE_FILE).then(setReportProfileJson),
            FnGetJsonFromPublicFolder(REPORT_LAYOUT_FILE).then(setReportLayoutJson),
            FnGetJsonFromPublicFolder(ORDER_FORM).then(setOrderFormJson),
            FnGetJsonFromPublicFolder(PROFORMA_INVOICE).then(setProformaInvoiceJson),
            FnGetJsonFromPublicFolder(QUOTE_FORM).then(setQuoteFormJson),
        ]).catch((error) => {
            console.error("Error updating resource json:", error);
        });
    }, [])


    const providers: IResource = useMemo(() => ({
        chartApiJson,
        setChartApiJson,
        chartProfileJson,
        setChartProfileJson,
        reportProfileJson,
        setReportProfileJson,
        reportLayoutJson,
        setReportLayoutJson,
        orderFormJson,
        setOrderFormJson,
        proformaInvoiceJson,
        setProformaInvoiceJson,
        quoteFormJson,
        setQuoteFormJson
    }), [
        chartApiJson,
        chartProfileJson,
        reportProfileJson,
        reportLayoutJson,
        orderFormJson,
        proformaInvoiceJson,
        quoteFormJson
    ]);

    return (
        <ResourceContext.Provider value={providers} >
            {children}
        </ResourceContext.Provider>
    );
}

export { ResourceContext };
export { ResourceProvider };
