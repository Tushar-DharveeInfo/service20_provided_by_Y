
interface IOptionToggle {
    showIcon: boolean;
    uniqueName: string;// unique name of component
    container: string; // name of container
    handleSelect: (value: string) => void
    featureId?: string // feature id 
}

export type { IOptionToggle }