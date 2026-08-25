
interface IDownloadFeature {
    uniqueName: string;//uniqueName for the control and required
    featureId: string;// feature id
    headerText?: string;// header text coming from the selected menu item
    handleShowUserMessage?: (messageText: string) => void;
}

export type { IDownloadFeature }
