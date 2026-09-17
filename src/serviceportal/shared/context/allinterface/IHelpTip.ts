
interface IHelpTipProperty {
    featureid: string;
    tip: string
}

interface IHelpTip {
    helpTipRecords: IHelpTipProperty[];
    setHelpTipRecords: (data: IHelpTipProperty[]) => void;
    isLoading: boolean;
    error: string | null;
}

export type { IHelpTip, IHelpTipProperty }