
interface IDialogActionBtn {
    label: string;
    onClick: () => void;
    autoFocus?: boolean;
    className?: string;
}
// This interface will be used in the Label component
interface IYesNoFormContainer {
    isOpen: boolean;// open message Dialog
    uniqueName: string; //uniqueName for the control and required
    message: string; // dialog
    container?: HTMLElement;
    handleYesButtonClick?: () => void //yes button click
    handleNoButtonClick?: () => void //no button click
    handleOkButtonClick?: () => void //ok button click
    dialogTitle?: string;
    showOkButton?: boolean // if you want to display only ok button then pass true.
    buttons?: IDialogActionBtn[];
}

export type { IYesNoFormContainer, IDialogActionBtn }