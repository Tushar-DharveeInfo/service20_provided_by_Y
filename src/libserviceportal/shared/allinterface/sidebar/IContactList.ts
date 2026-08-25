import { ITreeNode } from "../tree/ITreeControl";

interface IContactList {
    uniqueName: string;
    headerText?: string;
    selectedNode?: ITreeNode;
    featureId?: string;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IContactList };
