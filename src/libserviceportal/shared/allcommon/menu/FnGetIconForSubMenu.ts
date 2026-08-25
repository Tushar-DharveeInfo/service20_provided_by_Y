
import { FnResolveIcons, N } from "./FnResolveIcons";

const subMenuAliases = {
    message24x24: "notes24x24",
    addanewlocation24x24: "addlocation24x24",
    assign24x24: "assetassigment24x24",
    ask24x24: "info24x24",
    settings24x24: "setting24x24",
    rear24x24: "R24x24",
    front24x24: "F24x24",
    download24x24: "Download24x24",
    addtodownloadcart24x24: "Download24x24",
    "3D24x24": 'ThreeD24x24',

};

const FnGetIconForSubMenu = FnResolveIcons({
    defaultIcon: N,
    aliases: subMenuAliases
});

export { FnGetIconForSubMenu }