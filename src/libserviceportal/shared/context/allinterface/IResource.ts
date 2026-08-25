interface IResource {
    chartApiJson: unknown;
    setChartApiJson: (data: unknown) => void;
    chartProfileJson: unknown;
    setChartProfileJson: (data: unknown) => void;
    reportProfileJson: unknown;
    setReportProfileJson: (data: unknown) => void;
    reportLayoutJson: unknown;
    setReportLayoutJson: (data: unknown) => void;
    orderFormJson: unknown;
    setOrderFormJson: (data: unknown) => void;
    proformaInvoiceJson: unknown;
    setProformaInvoiceJson: (data: unknown) => void;
    quoteFormJson: unknown;
    setQuoteFormJson: (data: unknown) => void;
}

export type { IResource };
