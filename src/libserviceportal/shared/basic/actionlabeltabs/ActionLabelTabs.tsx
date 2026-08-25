
import { useEffect, useState } from "react";
import "../../allcss/basic/ActionLabelTabs.css";
import { IActionLabelTabs, ILabelItem } from "../../allinterface/basic/IActionLabelTabs.ts";
import { IActionLabelStrip } from "../../allinterface/basic/IActionLabelStrip.ts";
import { IActionLabel } from "../../allinterface/basic/IActionLabel.ts";
import { ActionLabelStrip } from "../actionlabelstrip/ActionLabelStrip.tsx";

const ActionLabelTabs = (tabsProps: IActionLabelTabs) => {
  const [actionLabelStrip, setActionLabelStrip] = useState<IActionLabelStrip | null>(null);

  useEffect(() => {
    if (tabsProps.labels) {
      const array: IActionLabel[] = [];
      tabsProps.labels.forEach((item: ILabelItem, index: number) => {
        const actionLabelObj: IActionLabel = {
          uniqueName: item.label,
          label: {
            uniqueName: item.label,
            label: item.label,
            tooltip: item.tooltip,
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: "normal",
            color: "var(--textprimary)",
          },
          w: "auto",
          h: "24px",
          allowIcon: tabsProps.allowStatusIcon,
          isSuccess: item.isSuccess,
          // border: "1px solid #000000",
          actionCode: item.label,
          selected: tabsProps.selectedTabName
            ? tabsProps.selectedTabName === item.label
              ? true
              : false
            : index === 0
              ? true
              : false,
          handleMouse: (event: any, actionCode?: string) => {

          }
        }
        array.push(actionLabelObj);
      });
      const actionLabelObj: IActionLabelStrip = {
        actionLabels: array,
        uniqueName: "tabs",
        isVertical: false,
        w: "100%",
        bgColor: "var(--bgfeaturepane1)",
        border: "1px solid var(--borderandscrollbar)",
        spacing: "2px",
        h: "24px"
      };
      setActionLabelStrip(actionLabelObj);
    }
  }, [tabsProps.labels, tabsProps.selectedTabName, tabsProps.allowStatusIcon]);

  const handleMouse = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => {
    if (actionCode) {
      tabsProps.handleMouse(actionCode);
    }
  };
  return (
    <>
      {actionLabelStrip && (
        <div className="nz-tabs-container">
          <ActionLabelStrip {...actionLabelStrip} handleMouse={handleMouse} />
        </div>
      )}
    </>
  );
};

export { ActionLabelTabs };
