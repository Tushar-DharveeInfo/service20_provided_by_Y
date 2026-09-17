
import { FnResolveIcons, Setting24x24 } from "../menu/FnResolveIcons";

const treeAliases = {
    helptip24x24: "N24x24",
    entityvstable24x24: "entityvstable24x24"
};

const FnGetIconForTreeNode = FnResolveIcons({
    defaultIcon: Setting24x24,
    aliases: treeAliases
});

export { FnGetIconForTreeNode }