
import { IActionLabel } from "./IActionLabel";

interface IOverlayTab {
    uniqueName: string; //Unique name for the control and required
    tabs: IActionLabel[]; // display tabs in overlay
    selectedTabName: string; // seleted Tab name as string
    tabAlignment: "horizontal" | "vertical";
    headerText: string;
    useContainer?: boolean;// if true then component should use its own container
    allowRenderSelectedOnly?: boolean; // if pass true then render only selected tab
    tabsComponent?: React.ReactNode[]; // Component for each tab
    allowMultipleSelect?: boolean;
    allowUnSelect?: boolean;
    allowIcon?: boolean;
    ShowOnlyIcon?: boolean;
    hideDrager?: boolean;
    hideOvelayPanel?: boolean;
    inlineOverlay?: boolean;// inline panel beside header text (no drag positioning)
    handleSelectedTab?: (tab: string[]) => void;
}

export type { IOverlayTab }
