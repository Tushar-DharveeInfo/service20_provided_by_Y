
interface ILabelItem {
  label: string;
  tooltip: string;
  isSuccess?: boolean;
}


interface IActionLabelTabs {
  labels: ILabelItem[];
  allowStatusIcon: boolean;// whether allow status icon or not
  handleMouse: (actionCode: string) => void // hendle mouse event for selected tabs
  selectedTabName?: string; // selected tab Name 
}


export type { IActionLabelTabs, ILabelItem }