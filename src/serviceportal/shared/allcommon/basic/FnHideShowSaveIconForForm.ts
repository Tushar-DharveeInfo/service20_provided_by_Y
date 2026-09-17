
const FnHideShowSaveIconForForm = (type: 'hide' | 'show') => {
    const saveButtons: NodeListOf<HTMLDivElement> = document.querySelectorAll('.nz-form-action-header .nz-form-header-action-save');
    saveButtons.forEach((saveButton) => {
        saveButton.style.display = type === 'hide' ? 'none' : 'flex';
    });
}

export { FnHideShowSaveIconForForm }