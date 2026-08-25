
import { Fragment, useEffect, useState } from 'react'
import { handleContainerKeyDown } from '../allcommon/basic/FnHandleContainerKeyDown'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { ICellRendererParams } from 'ag-grid-community'
import './PropertyTab.css'
import { NameRenderer } from '../tablegrid/NameRenderer'
import { ViewContainer } from '../viewcontainer/ViewContainer';
import { BasicGrid } from '../tablegrid/BasicGrid'
import { IBasicGridColDef } from '../allinterface/tablegrid/IBasicGrid'
import { Label } from '../basic/label/Label'
import { IView } from '../allinterface/deviceview/IView'

/** Raw property field parsed from a Properties JSON string. */
interface IRawPropertyField {
    PName: string;
    PropertyValue: string | number;
    PropertyDescription: string;
    PropertyLabel: string;
}

/** Row displayed in a property grid section. */
interface IPropertyTableRow {
    Name: string;
    Value: string | number;
    Description: string;
    PropertyLabel: string;
    DisplayControl: string;
    Desc?: string;
}

/** Property table section (group) from transformDeviceData or API. */
interface IPropertyGroup {
    TableName?: string;
    TableLabel?: string;
    Description?: string;
    Properties?: string;
    tableData?: IPropertyTableRow[];
}

/** Property payload: group array; may include pre-built DescriptionObj sections. */
type IPropertyTabInput = IPropertyGroup[] & { DescriptionObj?: IPropertyGroup[] };

/** Props for the DeviceModel Property tab (grid + device view). */
interface IPropertyTab {
    uniqueName: string;
    /** Device property groups from API or transformDeviceData. */
    propertyData: IPropertyTabInput;
    featureId: string;
    selectedRadio?: string;
    views?: IView[];
    selectedTabName?: string;
}

/* Returns true when property data uses pre-formatted DescriptionObj sections. */
const hasDescriptionObj = (
    data: IPropertyTab['propertyData']
): data is IPropertyTab['propertyData'] & { DescriptionObj: IPropertyGroup[] } =>
    Array.isArray(data) && Array.isArray(data.DescriptionObj);

/* Returns true when value matches a raw property field from Properties JSON. */
const isRawPropertyField = (value: unknown): value is IRawPropertyField =>
    typeof value === 'object' &&
    value !== null &&
    'PName' in value &&
    'PropertyValue' in value &&
    'PropertyDescription' in value &&
    'PropertyLabel' in value;

/* Strips PG_ prefix and underscores from a table section label. */
const formatTableLabel = (label?: string): string => {
    if (!label) {
        return '';
    }
    return label.replace(/^PG_/, '').replace(/_/g, '');
};

/* Maps one raw property field to a grid row. */
const makeDataOneToOneRelation = (data: IRawPropertyField): IPropertyTableRow => ({
    Name: data.PName,
    Value: data.PropertyValue,
    Description: data.PropertyDescription,
    PropertyLabel: data.PropertyLabel,
    DisplayControl: 'TextControl',
});

/* Property tab with hardware property grids and Front/Rear device view. */
const PropertyTab = (props: IPropertyTab) => {
    const [propertyData, setPropertyData] = useState<IPropertyGroup[]>([]);
    const [formattedData, setFormattedData] = useState<IPropertyGroup[]>([]);
    const [descriptionObjMode, setDescriptionObjMode] = useState(false);

    /* Column set when DescriptionObj layout is used (NameRenderer + Desc tooltip). */
    const gridColumns: IBasicGridColDef[] = [
        { field: 'id', hide: true },
        {
            field: 'PropertyLabel',
            headerName: 'Name',
            cellClass: 'nz-name-cell',
            width: undefined,
            resizable: true,
            editable: false,
            cellRendererSelector: () => ({
                component: NameRenderer,
            }),
        },
        {
            field: 'Value',
            headerName: 'Value',
            minWidth: 100,
            flex: 1,
            resizable: false,
            cellRenderer: (params: ICellRendererParams<IPropertyTableRow>) => (
                <span title={params.data?.Desc}>
                    {params.data?.Value?.toString()}
                </span>
            ),
            editable: false,
        },
    ];

    /* Default column set for standard property groups. */
    const columnDefs: IBasicGridColDef[] = [
        { field: 'id', hide: true },
        {
            field: 'PropertyLabel',
            headerName: 'Name',
            cellClass: 'nz-name-cell',
            width: undefined,
            resizable: true,
            cellRenderer: (params: ICellRendererParams<IPropertyTableRow>) => (
                <span title={params.data?.Description}>
                    {params.data?.Name?.toString()}
                </span>
            ),
        },
        {
            field: 'Value',
            headerName: 'Value',
            minWidth: 100,
            resizable: false,
            flex: 1,
            editable: false,
        },
    ];

    /* Sync local state when parent propertyData changes. */
    useEffect(() => {
        try {
            const { propertyData: incomingData } = props;

            if (Array.isArray(incomingData) && incomingData.length > 0) {
                if (hasDescriptionObj(incomingData)) {
                    setDescriptionObjMode(true);
                    setFormattedData(incomingData.DescriptionObj);
                } else {
                    setDescriptionObjMode(false);
                    setPropertyData(incomingData);
                }
            } else {
                setPropertyData([]);
                setFormattedData([]);
                setDescriptionObjMode(false);
            }
        } catch (error) {
            console.error('PropertyTab: failed to sync property data', error);
            setPropertyData([]);
            setFormattedData([]);
            setDescriptionObjMode(false);
        }
    }, [props.propertyData]);

    /* Parse Properties JSON on each group and build grid row data. */
    useEffect(() => {
        if (!propertyData.length) {
            return;
        }

        let cancelled = false;

        const formatPropertyGroups = async () => {
            try {
                const objectArray: IPropertyGroup[] = [];

                for (const element of propertyData) {
                    if (!element.Properties) {
                        continue;
                    }

                    let jsonProps: unknown;
                    try {
                        jsonProps = JSON.parse(element.Properties);
                    } catch (parseError) {
                        console.error('PropertyTab: failed to parse Properties JSON', parseError);
                        continue;
                    }

                    if (!Array.isArray(jsonProps) || jsonProps.length === 0) {
                        continue;
                    }

                    const tableRows: IPropertyTableRow[] = [];
                    for (const item of jsonProps) {
                        if (isRawPropertyField(item)) {
                            tableRows.push(makeDataOneToOneRelation(item));
                        }
                    }

                    objectArray.push({ ...element, tableData: tableRows });
                }

                if (!cancelled) {
                    setFormattedData(objectArray);
                }
            } catch (error) {
                console.error('PropertyTab: failed to format property groups', error);
                if (!cancelled) {
                    setFormattedData([]);
                }
            }
        };

        formatPropertyGroups();

        return () => {
            cancelled = true;
        };
    }, [propertyData]);

    const propertyGrids = (
        <div className='nz-property-grid-div'>
            {formattedData.length > 0 && formattedData.map((item, index) => (
                <Fragment key={`property${index}`}>
                    {item.TableLabel && (
                        <Fragment key={index}>
                            <div className="nz-sub-header">
                                {formatTableLabel(item.TableLabel)}
                            </div>
                            <div className={Object.keys(formattedData).length === 1 ? 'nz-OnetoOne-Grid nz-hw-prop-table' : 'nz-OnetoOne-Grid nz-hw-prop-table-multi'}>
                                <BasicGrid
                                    instanceName='property_view_tables'
                                    featureId={props.featureId}
                                    allowColumnFilter={true}
                                    isExportOnCopy={false}
                                    allowColumnResize={true}
                                    rowData={item.tableData}
                                    isReadOnly={true}
                                    containerName={item.TableName as string}
                                    columnDefs={descriptionObjMode ? gridColumns : columnDefs}
                                    className={'nz-user'}
                                    allowAutoSizeColumn={true}
                                    uniqueName={'nz-device-model-property-view'}
                                    showGrid={true}
                                />
                            </div>
                        </Fragment>
                    )}
                </Fragment>
            ))}
        </div>
    );

    return (
        <div className="nz-propertyTab-main" tabIndex={1} onKeyDown={handleContainerKeyDown}>
            {props.hideDeviceView ? (
                <div className='nz-property-splitter-panel nz-w-100 nz-h-100'>
                    {propertyGrids}
                </div>
            ) : (
                <Splitter tabIndex={-1} layout="vertical" className='nz-w-100 nz-h-100' >
                    <SplitterPanel tabIndex={-1} className='nz-property-splitter-panel' minSize={30}>
                        {propertyGrids}
                    </SplitterPanel>
                    <SplitterPanel tabIndex={-1} minSize={30}>
                        <div className='nz-device-view-container'>
                            {props.views?.length ? (
                                <ViewContainer
                                    views={props.views}
                                    selectedTabName={props.selectedTabName ?? ''}
                                    title={'Device View'}
                                    uniqueName={'deviceview'}
                                    entID={''}
                                />
                            ) : (
                                <div className='nz-wh-100 nz-d-flex-hv-left'>
                                    <Label uniqueName={`${props.uniqueName}-tables-nodat`} label='No data found' />
                                </div>
                            )}
                        </div>
                    </SplitterPanel>
                </Splitter>
            )}
        </div>
    );
};

export { PropertyTab };
export type {
    IPropertyTab,
    IRawPropertyField,
    IPropertyTableRow,
    IPropertyGroup,
    IPropertyTabInput,
};
