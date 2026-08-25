
import { IMenuItem } from "../../allinterface/menu/IMainMenu";

// below function will return submenus
const FnGetSubMenus = (list: IMenuItem[], id: number, parentName?: string) => {
    try {
        if (!Array.isArray(list)) {
            return [];
        }

        var filteredlist = list.filter((value: any,) => {
            return value._Feature !== value.MenuID && value.MenuID === id;
        });
        if (filteredlist && filteredlist.length > 0) {
            filteredlist.map((item: IMenuItem) => {
                item.parentName = parentName;
                item.parentFeatureId = id;
                return item;
            })
            filteredlist = filteredlist.sort(
                (a: any, b: any) => a.SortOrder - b.SortOrder
            );
            return filteredlist;
        } else {
            return [];
        }
    } catch (error) {
        console.error("FnGetSubMenus error:", error);
        return [];
    }
}

export { FnGetSubMenus }
