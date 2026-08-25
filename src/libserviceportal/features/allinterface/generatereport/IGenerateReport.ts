
type TReportTableRow = Record<string, unknown>;
type TReportDataset = Record<string, TReportTableRow[]>;

type TReportAddressFields = {
    From: string;
    contact: string;
    billto: string;
    shipto: string;
};

type TReportDocType =
    | { PO: string }
    | { Invoice: string }
    | { Quote: string };

type TReportDocTypeInput = {
    doctype: TReportDocType;
};

interface IGenerateReport {
    uniqueName?: string;
    /* Required report layout such as OrderForm.json */
    reportTemplate: Record<string, unknown>;

    pdfFilename: string; //pass filename for the generated PDF file, default is "report.pdf"
    /* p1: address/contact text blocks for text objects */
    addressFields: TReportAddressFields;
    /* p2: document type text for _PO text object */
    docType: TReportDocTypeInput;
    /* p3: dataset keyed by datatable id */
    dataset1: TReportDataset;
    /* p4: dataset keyed by datatable id */
    dataset2: TReportDataset;
}

export type {
    IGenerateReport,
    TReportTableRow,
    TReportDataset,
    TReportAddressFields,
    TReportDocType,
    TReportDocTypeInput,
};
