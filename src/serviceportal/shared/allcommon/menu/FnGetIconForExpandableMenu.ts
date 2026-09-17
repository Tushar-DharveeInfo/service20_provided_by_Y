
import { FnResolveIcons, N } from "./FnResolveIcons";

const expandableAliases = {
    settings24x24: "setting24x24",
    myactivities24x24: "MyActvities24x24",
};

const FnGetIconForExpandableMenu = FnResolveIcons({
    defaultIcon: N,
    aliases: expandableAliases
});

export { FnGetIconForExpandableMenu }
