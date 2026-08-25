
import { TReportAddressFields, TReportDataset, TReportDocTypeInput } from "../allinterface/generatereport/IGenerateReport";


/* Merges two dataset maps (p3 + p4) into a single lookup keyed by datatable id. */
const mergeReportDatasets = (
    dataset1: TReportDataset = {},
    dataset2: TReportDataset = {}
): TReportDataset => ({
    ...dataset1,
    ...dataset2,
});

/* Formats the document-type input (PO, Invoice, or Quote) into a display label for the _PO text object. */
const resolveDocTypeLabel = (docTypeInput: TReportDocTypeInput): string => {
    const { doctype } = docTypeInput;

    if ("PO" in doctype) {
        return `PO: ${doctype.PO}`;
    }

    if ("Invoice" in doctype) {
        return `Invoice: ${doctype.Invoice}`;
    }

    if ("Quote" in doctype) {
        return `Quote: ${doctype.Quote}`;
    }

    return "";
};
const ORDER_FORM_TEXT_IDS = {
    contact: "_To",
    From: "_From",
    billto: "_BillTo",
    shipto: "_ShipTo",
    doctype: "_PO",
} as const;

/*
 * Walks the layout tree and sets text object labels from address fields and document type.
 * Matches text items by id (_To, _From, _BillTo, _ShipTo, _PO).
 */
const injectReportTextData = (
    node: Record<string, unknown>,
    addressFields: TReportAddressFields,
    docTypeLabel: string
): Record<string, unknown> => {
    const updated = { ...node };
    /* Inject text data into the layout tree for address/contact and document type. */
    if (Array.isArray(updated.textArray)) {
        updated.textArray = (updated.textArray as Record<string, unknown>[]).map((textItem) => {
            const textId = typeof textItem?.id === "string" ? textItem.id : "";

            if (textId === ORDER_FORM_TEXT_IDS.contact) {
                return { ...textItem, label: addressFields.contact };
            }

            if (textId === ORDER_FORM_TEXT_IDS.From) {
                return { ...textItem, label: addressFields.From };
            }

            if (textId === ORDER_FORM_TEXT_IDS.billto) {
                return { ...textItem, label: addressFields.billto };
            }

            if (textId === ORDER_FORM_TEXT_IDS.shipto) {
                return { ...textItem, label: addressFields.shipto };
            }

            if (textId === ORDER_FORM_TEXT_IDS.doctype) {
                return { ...textItem, label: docTypeLabel };
            }

            return textItem;
        });
    }
    /* Inject text data into child locations. */
    if (Array.isArray(updated.locationArray)) {
        updated.locationArray = (updated.locationArray as Record<string, unknown>[]).map(
            (location) => injectReportTextData(location, addressFields, docTypeLabel)
        );
    }

    return updated;
};

/*
 * Walks the layout tree and injects row data into datatables by matching table id to dataset keys.
 * Clears inmemoryUrl so the renderer uses the provided tableData.
 */
const injectReportTableData = (
    node: Record<string, unknown>,
    tables: TReportDataset
): Record<string, unknown> => {
    const updated = { ...node };

    if (Array.isArray(updated.datatableArray)) {
        updated.datatableArray = (updated.datatableArray as Record<string, unknown>[]).map(
            (tableItem) => {
                const tableId = typeof tableItem?.id === "string" ? tableItem.id : "";
                const rows = tableId ? tables[tableId] : undefined;

                if (!rows) {
                    return tableItem;
                }

                return {
                    ...tableItem,
                    tableData: rows,
                    inmemoryUrl: "",
                };
            }
        );
    }

    if (Array.isArray(updated.locationArray)) {
        updated.locationArray = (updated.locationArray as Record<string, unknown>[]).map(
            (location) => injectReportTableData(location, tables)
        );
    }

    return updated;
};

/*
 * Builds the final report layout from an OrderForm template and four parameter groups:
 * p1 — address/contact text blocks (\\n line breaks) for text objects
 * p2 — document type text for the _PO text object
 * p3 — dataset keyed by datatable id (e.g. _Orders: [...])
 * p4 — dataset keyed by datatable id (e.g. _Totals: [...])
 */
const FnBuildReportLayoutConfig = (
    reportTemplate: Record<string, unknown>, 
    addressFields: TReportAddressFields,
    docTypeInput: TReportDocTypeInput,
    dataset1: TReportDataset,
    dataset2: TReportDataset
): Record<string, unknown> => {
    try {
        if (!reportTemplate || typeof reportTemplate !== "object") {
            return {};
        }
        /* Resolve the document type label for the _PO text object. */
        const docTypeLabel = resolveDocTypeLabel(docTypeInput);
        /* Merge the two datasets (p3 + p4) into a single lookup keyed by datatable id. */
        const tables = mergeReportDatasets(dataset1, dataset2);
        /* Inject text data into the layout tree for address/contact and document type. */
        const withText = injectReportTextData(
            structuredClone(reportTemplate),
            addressFields,
            docTypeLabel
        );
        /* Inject table data into the layout tree for datatables. */
        return injectReportTableData(withText, tables);
    } catch (error) {
        console.error("FnBuildReportLayoutConfig error:", error);
        return reportTemplate;
    }
};

export {
    FnBuildReportLayoutConfig,
    ORDER_FORM_TEXT_IDS,
    mergeReportDatasets,
    resolveDocTypeLabel,
};

export type {
    TReportDataset,
    TReportAddressFields,
    TReportDocTypeInput,
};
