
const FnHideShowSaveIconForForm = (type: 'hide' | 'show') => {
    if (type === "hide") {
        const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
        if (saveButton) {
            saveButton.style.display = "none";
        }
    }
    else {
        const saveButton: HTMLDivElement | null = document.querySelector('.nz-form-action-header .nz-form-header-action-save');
        if (saveButton) {
            saveButton.style.display = "flex";
        }
    }
}

export { FnHideShowSaveIconForForm }