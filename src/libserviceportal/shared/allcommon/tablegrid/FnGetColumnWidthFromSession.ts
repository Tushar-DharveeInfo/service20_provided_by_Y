import { FnGetSessionStorageItem } from "../basic/FnGetSessionStorageItem";
import { IStatusBar } from "../../context/allinterface/IStatusBar";

/* Column-width session lookup — remote DATAGRID API removed; returns null. */
const FnGetColumnWidthFromSession = async (
    gridName: string,
    _columnName: string = "",
    _statusBarContext: IStatusBar
) => {
    try {
        if (!gridName || typeof gridName !== "string") return null;
        void FnGetSessionStorageItem("col_pane_width_json");
        return null;
    } catch (error) {
        console.error("FnGetColumnWidthFromSession error:", error);
        return null;
    }
};

export { FnGetColumnWidthFromSession };
