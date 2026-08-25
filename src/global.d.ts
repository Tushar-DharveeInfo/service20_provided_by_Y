export { };
/*
This declaration file extends the built-in Window interface with custom properties: showSaveFilePicker and APP_CONFIG.
This allows to access them like window.showSaveFilePicker() or window.APP_CONFIG.TENANT_NICKNAME without TypeScript errors about missing properties.
*/
declare global {
    interface Window {
        showSaveFilePicker: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
        showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
        APP_CONFIG: {
            TENANT_NICKNAME: string;
            TENANT_DISPLAY_NAME: string;
            AUTH_TYPE: string;
            NODE_ENV: string;
            VITE_API_AT: string;
            DEPLOYMENT_N20_API_URL: string;
            CLOUDRUN_API_URL: string;
        };
    }
}
