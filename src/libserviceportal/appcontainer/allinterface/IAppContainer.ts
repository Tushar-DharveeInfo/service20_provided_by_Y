
interface IAppContainer {
    uniqueName: string;//unique identifier for the control
    isNewSession: boolean;//indicates if this is a new session
    handleThemeChange: (theme: unknown) => void;// handler for theme change 

}

export type { IAppContainer }