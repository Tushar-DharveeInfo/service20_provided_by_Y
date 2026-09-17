
import { CellClickedEvent, CellMouseDownEvent, ColDef, FirstDataRenderedEvent, GridOptions, GridReadyEvent, ICellRendererParams, RowClassRules, RowClickedEvent, RowDataUpdatedEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { IFeatureItem } from "../menu/INodeMenu";
import { IActionImageForSubMenu } from "../basic/IActionImageList";

/* Cabling section payload for grid context (cabling feature not in this build). */
type ICablingGridSection = Record<string, unknown>;

interface IBasicGridColDef extends ColDef {
    DisplayControl?: string; // display control like input,select,textarea etc.
    IsRequired?: boolean; // required field
    IsReadOnly?: boolean;  // read only field
    id?: string;
    flex?: number;
}

/* Row objects passed into the grid; shape varies by grid instance and API. */
type TGridRow = Record<string, unknown>;

type TGridRowData = TGridRow[];

interface IGridRowWithSelection extends TGridRow {
    selected?: boolean;
    Selected?: boolean;
    IsNZ?: boolean;
}

interface ICellEditingRowData extends TGridRow {
    IsSaved?: boolean;
}

interface IDescendingRowData extends TGridRow {
    special?: number;
}

interface IColumnWidthEntry {
    colname: string;
    colwidth: number;
    headerName: string;
    isHidden?: boolean;
}

interface IDataGridWidthPayload {
    UserID: string | undefined;
    DataGridName: string;
    ColWidthJsonArray: string;
}

/* Forensic log passes a mutable request object at runtime (IBasicGrid types it loosely). */
interface IForensicLogPaginationPayload {
    startPage?: number;
    recordCount?: number;
    [key: string]: unknown;
}

interface IFilteredLogApiResponse {
    logJson?: string;
}

interface IAutoSizeColumnDef extends IBasicGridColDef {
    field?: string;
}

/* Column defs may carry runtime width metadata from AG Grid after resize/toggle. */
interface IExtendedBasicGridColDef extends IBasicGridColDef {
    actualWidth?: number;
    colId?: string;
    userProvidedColDef?: { headerName?: string };
}



interface IBasicGrid {
    uniqueName: string// unique name
    instanceName: string; // grid instance name
    showGrid: boolean; // hide show grid base
    rowData: any;  // grid row data
    containerName: string; // grid container name
    columnDefs?: IBasicGridColDef[]; // grid column data
    totalRecords?: number; // display in pagination total records
    className?: string; // grid class name
    gridRef?: React.RefObject<AgGridReact> | any; // grid reference 
    featureId?: string;//feature id
    allowPagination?: boolean; // to show or hide pagination
    rowClassRules?: RowClassRules | null; //dynamically applies CSS classes to rows based on data or custom conditions.
    paginationPageSize?: number; //sets the number of rows displayed per page when pagination is enabled.
    gridOptions?: GridOptions | any; // grid options
    paginationAutoPageSize?: boolean; //automatically adjusts the number of rows per page based on the grid's height
    rowSelection?: 'single' | 'multiple'; // sets the type of row selection
    hideCopyIcon?: boolean; // hide or shows copy icon
    id?: string | ""; // grid id
    isReadOnly?: boolean; // sets readonly grid.
    gridName?: string;// grid name
    allowColumnResize?: boolean; // allow column resize (if you pass false then it will allow resize all column accept id and last column)
    allowSort?: boolean; // allow sorting
    allowEdit?: boolean; //allow edit
    allowDeleteButton?: boolean; //allow delete
    allowEditButton?: boolean; //allow edit
    allowDrag?: boolean; //  allow drag and drop
    checkboxSelection?: boolean; // allow checkbox selection in header
    allowFilter?: boolean; // allow filter on row header
    descRowNumber?: boolean; // show row number in descending order in id column
    rowNumber?: boolean; // show id column
    allowRWD?: boolean; // allow read,write and delete
    dynamicPagination?: boolean; // allow dynamic pagination
    entityName?: string; // entity name of grid
    isExportOnCopy?: boolean; // show export/download icon on grid header
    exportFileName?: string; // export/download file name 
    hideRowKebabMenu?: boolean; // hide or show row kebab menu
    allowCheckBoxOnRow?: boolean; // allow checkbox on row
    allowAutoSizeColumn?: boolean; // allow auto size column
    tableName?: string; // table name
    propertyData?: any; // property data for property grid
    hideCopyRowIcon?: boolean; // show hide copy icon on row  
    tableLabel?: string; // to display on header of table label
    showPropertyHeader?: boolean; //  show header on for property panel
    featureData?: IFeatureItem[]; // feature data
    cablingTabelData?: ICablingGridSection[];
    diagnosticLevel?: string;
    initRecordCount?: number;
    allowColumnFilter?: boolean;
    loginType?: string; // forensic log filter type (e.g. "Node" skips pagination API)
    apiPayloadForPangination?: IForensicLogPaginationPayload; // api payload for pagination
    handleMouseEvent?: (event: CellClickedEvent | RowClickedEvent | CellMouseDownEvent, gridRef: any) => void; // grid cell clicked function
    handleMouseForEdit?: (value?: ICellRendererParams) => void //edit button click
    handleMouseForDelete?: (value?: ICellRendererParams) => void //delete button click
    onCellClicked?: (event: CellClickedEvent | RowClickedEvent | CellMouseDownEvent, gridRef: unknown) => void // when cell click 
    handleNodeMenuOnClick?: (value: IActionImageForSubMenu, selectedRow: any, instanceName: string) => void // node menu click
    handleGridReady?: (params: GridReadyEvent) => void;
    handleDownloadData?: () => void;
    onFirstDataRendered?: (event: FirstDataRenderedEvent<any, any>) => void;
    onRowDataUpdated?: (event: RowDataUpdatedEvent<any, any>) => void;
    onSelectionChanged?: (event: any) => void;
}

export type {
    IBasicGrid,
    IBasicGridColDef,
    TGridRow,
    TGridRowData,
    IGridRowWithSelection,
    ICellEditingRowData,
    IDescendingRowData,
    IColumnWidthEntry,
    IDataGridWidthPayload,
    IForensicLogPaginationPayload,
    IFilteredLogApiResponse,
    IAutoSizeColumnDef,
    IExtendedBasicGridColDef,
};

