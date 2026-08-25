
import { ITreeNode } from "../tree/ITreeControl";

/* DeviceModel component props and shared type definitions. */

/* External search criteria passed into DeviceModel from a parent feature. */
type IExternalSearch = {
    Source?: string;
    AndOrFlag?: boolean;
    Keywords?: string;
}

/* Props for the DeviceModel sidebar search and result pane. */
interface IDeviceModel 
{
    uniqueName: string;
    featureId: string;
    selectedNode: ITreeNode;
    selectedFeatuerQa?: string;
    isLibFolder?: boolean;
    ShowOnlyLibraryRadioB?: boolean;
    treeData?: ITreeNode[] | null;
    externalSearch?: IExternalSearch;
    /** Called when user clicks Add to Download cart on a selected product node. */
    addToDownloadCart?: (mfg: string, prodno: string, EQID: string) => void;
    /** Called when user clicks Search on the DeviceModel search pane, it gives the search criteria to embedding code. */
    saveSearchCriteria?: (searchText?: string, AndOr?: "AND" | "OR", mfg?: string, eqtype?: string, pno?: string) => void;
}

/* Shared DeviceModel search, API, and tree-building types. */

/* Generic JSON object from device-model APIs. */
type JsonRecord = Record<string, unknown>;

/* Dropdown option for manufacturer, equipment type, or product. */
interface IDeviceSearchOption {
    label?: string;
    value?: string;
    mfg?: string;
    ma?: string;
    mty?: string;
    pno?: string;
    [key: string]: unknown;
}

/* Search form profile values keyed by control name. */
interface IDeviceModelProfileString {
    Manufacturer?: IDeviceSearchOption | string;
    "Equipment Type"?: string;
    "Product Number"?: string;
    Source?: string;
    [key: string]: unknown;
}

/* Single row from wild-search with match score and device identifiers. */
interface IDeviceWildSearchItem {
    id?: string;
    matchScore: number;
    mfgprefix?: string;
    mfg?: string;
    mty?: string;
    pno?: string;
    ma?: string;
    entid?: string;
    ty?: string;
    md?: string;
    Attrib?: string;
    [key: string]: unknown;
}

/* Manufacturer entry used to filter search results by related mfg. */
interface IFilterMfgEntry {
    Manufacturer: string;
}

/* GetDeviceDetails API wrapper with serialized deviceJson payload. */
interface IDeviceJsonApiResponse {
    deviceJson?: string;
}

/* GetMfgNew API wrapper with serialized mfgJson payload. */
interface IDeviceMfgJsonApiResponse {
    mfgJson?: string;
}

/* GetDeviceModelSvg API wrapper with serialized preview JSON. */
interface IDevicePreviewApiResponse {
    devicePreviewJson?: string;
}

/* NetZoom lib wildsearch.json root shape. */
interface ILibWildSearchData {
    WildSearch?: IDeviceWildSearchItem[];
}

/* One manufacturer-to-related-manufacturer mapping from related.json. */
interface IRelatedManufacturerRecord {
    Manufacturer?: string;
    RelatedManufacturer?: string;
}

/* NetZoom lib related.json root shape. */
interface ILibRelatedData {
    Related?: IRelatedManufacturerRecord[];
}

/* Manufacturer name and acronym from mfgacronym lib or GetMfgNew. */
interface IMfgAcronymItem {
    mfg?: string;
    ma?: string;
    [key: string]: unknown;
}

/* Manufacturer list response keyed by MfgAcronym. */
interface IMfgAcronymResponse {
    MfgAcronym?: IMfgAcronymItem[];
}

/* SVG shape metadata for Front/Rear device views. */
interface IShapeRecord {
    ShapeID?: string | number | null;
    Scale?: string | number | null;
    ViewShortName?: string;
    bSVG?: string;
    LastUpdated?: string;
}

/* View entry (Front/Rear) attached to a device record. */
interface IDeviceViewRecord {
    ViewShortName?: string;
    ShapeID?: string | number;
    EntID?: string;
    EQID?: string;
}

/* Base64-encoded lib file returned from multi-file download. */
interface IFileObject {
    filePath: string;
    content: string;
    contentType: string;
    size: number;
}

/* Property tab rows shown for the selected device. */
type IPropertyTabData = Record<string, unknown>[];

/* Parsed drag/drop target node metadata from tree DOM attributes. */
interface IDropNodeInfo {
    NodeType?: string;
    treetype?: string;
    Type?: string;
    NodeEntID?: string;
    Name?: string;
    NodeEntityname?: string;
    [key: string]: unknown;
}

/* Wild-search results grouped by match score before tree merge. */
interface IMatchScoreTreeGroup {
    matchScore: number;
    /* Lib search file records; matchScore is merged before makeResultTree. */
    apiData: IDeviceEqTypeRecord[];
}

/* Device record from search JSON (mfg, eq type, product, views). */
interface IDeviceEqTypeRecord {
    id?: string;
    mfg?: string;
    mty?: string;
    pno?: string;
    ma?: string;
    entid?: string;
    ty?: string;
    md?: string;
    Attrib?: string;
    Views?: string | IDeviceViewRecord[];
    details?: string;
    EntID?: string;
    [key: string]: unknown;
}

/* Flat row passed to FnConvertFlatDataToHierarchyData for tree nodes. */
interface IFlatTreeFormattedRow {
    ManufacturerName?: string;
    ManufacturerNodeType?: string;
    ManufacturerEntID?: string;
    ManufacturerHasChildren?: boolean;
    EqtypeName?: string;
    EqtypeNodeType?: string;
    EqtypeEntID?: string;
    EqtypeParentID?: string;
    EqtypeHasChildren?: boolean;
    EqtypeEQType?: string;
    EqtypeDeviceEntId?: string;
    ProductEntID?: string;
    ProductEQID?: string;
    ProductEQType?: string;
    ProductName?: string;
    ProductDescription?: string;
    ProductAttrib?: string;
    ProductParentID?: string;
    ProductDetailsJson?: string;
    ProductNodeType?: string;
    ProductHasChildren?: boolean;
    ProductDeviceEntId?: string;
    ViewName?: string;
    ViewEntID?: string | number;
    ViewViewEntID?: string;
    ViewNodeType?: string;
    ViewParentID?: string;
    ViewEQID?: string;
    ViewParentEQID?: string;
    ViewEQType?: string;
    ViewDetailsJson?: string;
    ViewDeviceViewEntId?: string;
    [key: string]: unknown;
}

/* DOM element extended with drag listener flag for tree nodes. */
interface IDraggableHTMLElement extends HTMLElement {
    _listenersAdded?: boolean;
}

/* Multi-file lib download response containing search JSON files. */
interface ILibFilesResponse {
    files?: IFileObject[];
}

/* Single lib search file with Search array of device records. */
interface ISearchJsonEntry {
    Search?: IDeviceEqTypeRecord[];
    [key: string]: unknown;
}

/* Map of lib file name to parsed search JSON entry. */
type IJsonDataMap = Record<string, ISearchJsonEntry>;

/* Form field value: plain string or manufacturer option object. */
type IDeviceFormFieldValue = string | IDeviceSearchOption;

/* Interceptor fetch callback signature. */
type IFetchDataCallback = (resp: unknown, status?: string) => void;

export type {
    JsonRecord,
    IDeviceSearchOption,
    IDeviceModelProfileString,
    IDeviceWildSearchItem,
    IFilterMfgEntry,
    IDeviceJsonApiResponse,
    IDeviceMfgJsonApiResponse,
    IDevicePreviewApiResponse,
    ILibWildSearchData,
    ILibRelatedData,
    IRelatedManufacturerRecord,
    IMfgAcronymItem,
    IMfgAcronymResponse,
    IShapeRecord,
    IDeviceViewRecord,
    IFileObject,
    IPropertyTabData,
    IDropNodeInfo,
    IMatchScoreTreeGroup,
    IDeviceEqTypeRecord,
    IFlatTreeFormattedRow,
    IDraggableHTMLElement,
    ILibFilesResponse,
    ISearchJsonEntry,
    IJsonDataMap,
    IDeviceFormFieldValue,
    IFetchDataCallback,
    IDeviceModel, IExternalSearch
};
