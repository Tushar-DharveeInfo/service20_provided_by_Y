import { ITreeNode } from "../entity/ITreeNode";

interface IFqaNotes {
    uniqueName: string; // A unique identifier for notes
    hideSearchControl: boolean;
    selectedNode: ITreeNode;
}
interface INoteItems {
    EntityName: string;
    LastUpdated: string;   // ISO timestamp, could also be Date if you parse it
    NodeType: string;
    NotesMAX: string;
    NotesType: string;
    UserName: string;
    audio?: unknown,
    file?: unknown,
    fileObj?: any,
    video?: unknown,
    FileUID?: string;
}
export type { IFqaNotes, INoteItems }