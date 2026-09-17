
import { Dialog } from '@mui/material'
import '../../allcss/basic/YesNoFormContainer.css'
import { YesNoForm } from '@n20a/libform'
import { IYesNoFormContainer } from '../../allinterface/basic/IYesNoFormContainer';

function YesNoFormContainer(DialogProps: IYesNoFormContainer) {

    const buttonLabels = DialogProps.buttons?.map(btn => btn.label)
        ?? (DialogProps.showOkButton ? ["Ok"] : ["No", "Yes"]);

    const handleButtonClick = (label: string): void => {
        const button = DialogProps.buttons?.find(
            (btn) => btn.label.toLowerCase() === label.toLowerCase()
        );

        if (button?.onClick) {
            button.onClick();
            return;
        }
        if (label.toLowerCase() === "ok") {
            DialogProps.handleOkButtonClick?.();
        }
        else if (label.toLowerCase() === "yes") {
            DialogProps.handleYesButtonClick?.();
        }
        else if (label.toLowerCase() === "no") {
            DialogProps.handleNoButtonClick?.();
        }
    }
    if (!DialogProps.isOpen) {
        return null;
    }
    return (
        <div className='nz-dialog' key={DialogProps.uniqueName}>
            <Dialog
                open={DialogProps.isOpen}
                className={`nz-delete-row-dialog ${DialogProps.container ? "nz-apply-style-in-dialog-container" : ""}`}
                maxWidth={"sm"}
                fullWidth={true}
                hideBackdrop={true}
                container={DialogProps.container}
            >
                <YesNoForm
                    message={DialogProps.message}
                    title={`${DialogProps.dialogTitle ?? "Information"}`}
                    buttonLabels={buttonLabels}
                    onButtonClick={handleButtonClick}
                />
            </Dialog>
        </div>
    )
}

export { YesNoFormContainer }