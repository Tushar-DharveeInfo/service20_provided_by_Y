
import { FeatureMenuRange } from "../../../constants/Feature";
import { IMenuItem } from "../../allinterface/menu/IMainMenu";

// below code will return the main menus
const FnGetMainMenus = (list: IMenuItem[]) => {
    try {
        if (!Array.isArray(list)) {
            return [];
        }

        return list.filter((value: IMenuItem) => {
            return (
                value._Feature && value._Feature === value.MenuID &&
                (value._Feature as number) < FeatureMenuRange.MAX
            );
        });
    } catch (error) {
        console.error("FnGetMainMenus error:", error);
        return [];
    }
}
export { FnGetMainMenus }
