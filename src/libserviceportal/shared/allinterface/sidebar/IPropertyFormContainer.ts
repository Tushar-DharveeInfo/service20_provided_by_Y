
import { IMenuItem } from "../menu/IMainMenu";
import { ITreeNode } from "../tree/ITreeControl";

interface IPropertyFormContainer {
    uniqueName: string; // A unique identifier for the dc property
    featureId: string;
    selectedNode: ITreeNode;
    selectedNodeMenu: IMenuItem | undefined// selected nodemenu data
    subTreeFeatureId?: string;
    featureData?: any[]; // feature data
    pgTableToShow?: string;
    showPgTableOneToOne?: boolean;
    treeData?: ITreeNode[];
    allowBackButton?: boolean;
    allowCloseButton?: boolean;
    isAllowCustomAction?: boolean;
    isReadOnly?: boolean;
    allowLog?: boolean;
    /*Prebuilt static property values (IDataset) from selected node — skips NODE.GetKebabMenuData when set. */
    kebabMenuData?: IDataset;
    /*Prebuilt entity table schema — skips EM.GetTableVsProperty / sample tables when set. */
    entityTables?: Record<string, unknown>[];
    handlePropertyChange?: (propertyData?: Record<string, any>) => boolean;
    handleValueChange?: (value: any, EntID: string, event: unknown, selectedData: unknown, instanceName?: string) => void; // ap form value change
    handleRefreshUpdatedRecord?: (newAddedId: string, newAddedName: string, action?: 'save' | 'back') => void;
}

interface IPropertyColumn {
    PName: string;
    PropertyLabel: string;
    DisplayControl: string;
    [key: string]: string | number | boolean | any;
}
interface ITableFormMeta {
    label: string;
    columns: IPropertyColumn[];
}
type IDataset = Record<string, Record<string, any>[]>;

export type { IPropertyFormContainer, IPropertyColumn, IDataset, ITableFormMeta }