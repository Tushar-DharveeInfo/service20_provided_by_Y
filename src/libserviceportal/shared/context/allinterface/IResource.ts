interface IResource {
    // Common Loading
    loading: boolean;

    // Chart API
    chartApiJson: unknown;
    setChartApiJson: (data: unknown) => void;
    getChartApi: (refresh?: boolean) => Promise<unknown>;

    // Chart Profile
    chartProfileJson: unknown;
    setChartProfileJson: (data: unknown) => void;
    getChartProfile: (refresh?: boolean) => Promise<unknown>;

    // Report Profile
    reportProfileJson: unknown;
    setReportProfileJson: (data: unknown) => void;
    getReportProfile: (refresh?: boolean) => Promise<unknown>;

    // Report Layout
    reportLayoutJson: unknown;
    setReportLayoutJson: (data: unknown) => void;
    getReportLayout: (refresh?: boolean) => Promise<unknown>;

    // Order Form
    orderFormJson: unknown;
    setOrderFormJson: (data: unknown) => void;
    getOrderForm: (refresh?: boolean) => Promise<unknown>;

    // Proforma Invoice
    proformaInvoiceJson: unknown;
    setProformaInvoiceJson: (data: unknown) => void;
    getProformaInvoice: (refresh?: boolean) => Promise<unknown>;

    // Quote Form
    quoteFormJson: unknown;
    setQuoteFormJson: (data: unknown) => void;
    getQuoteForm: (refresh?: boolean) => Promise<unknown>;
}

export type { IResource };
