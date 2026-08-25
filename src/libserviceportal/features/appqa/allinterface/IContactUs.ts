
interface IContactUs {
    uniqueName: string;
    headerText: string;
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IContactUs }
