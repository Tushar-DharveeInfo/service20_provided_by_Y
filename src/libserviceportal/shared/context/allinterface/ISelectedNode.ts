
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

interface ISelectedNodeProperty {
    RecID: string;                // Unique record ID
    EntID: string;                // Entity ID
    EntityName: string;          // Type of entity, e.g., "Room"
    LastUpdated?: string;        // ISO or formatted datetime string
    _Site?: string;
    _Room?: string;
    Desc250?: string;
    RoomType?: string;
    Width?: number;
    Length?: number;
    Height?: number;
    Secured?: boolean;
    IsNZ?: boolean;
    // Index signature for flexibility
    [key: string]: any;
}

interface ISelectedNode {
    selectedNode?: ITreeNode;
    selectedNodeExplorer?: ITreeNode; // Optional, can be used to store the selected node in the explorer
    selectedNodeProperty?: ISelectedNodeProperty;
    setSelectedNode: (treeNode: ITreeNode) => void;
    setSelectedNodeProperty: (selectedNodeProperty: ISelectedNodeProperty) => void;
    setSelectedNodeExplorer: (selectedNodeExplorer?: ITreeNode) => void;
}
export type { ISelectedNode, ISelectedNodeProperty }
