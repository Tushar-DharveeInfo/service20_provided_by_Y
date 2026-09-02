/**
 * Icon resolver for service menus.
 * Imports only icons needed for Labels in feature.json (+ small shared/fallback set).
 */

import { getfeaturesData } from "../../context/contextandprovider/MainApp";

import {
    // Fallback / shared
    N,
    Setting24x24,
    More24x24,
    Info24x24,
    F24x24,
    R24x24,
    ThreeD24x24,
    EntityvsTable24x24,

    // feature.json Labels that have matching libicon exports
    Signout24x24,
    Help24x24,
    Theme24x24,
    ContactUs24x24,
    Profile24x24,
    MyProfile24x24,
    MySubscriptions24x24,
    Buy24x24,
    Purchase24x24,
    Eula24x24,
    Visio,
    Other24x24,
    Services24x24,
    RequestSupport24x24,
    RequestVisioStencils24x24,
    RequestDeviceModels24x24,
    MyRequests24x24,
    Download24x24,
    DownloadVisioStencils24x24,
    FAQ24x24,
    Cart24x24,
    Orders24x24,
    Details24x24,
    Notes24x24,
    DownloadNetZoom24x24,
    MyActivities24x24,
    Manufacturer24x24,



    Accessory24x24,
    Appliance24x24,
    AV24x24,
    BladeEnclosure24x24,
    BladeFiber24x24,
    BladeServer24x24,
    BladeStorage24x24,
    Cable24x24,
    Card24x24,
    Chassis24x24,
    CircuitBreaker24x24,
    Connector24x24,
    CoolingUnit24x24,
    Cooling24x24,
    Display24x24,
    Door24x24,
    Enclosure24x24,
    Fan24x24,
    Frame24x24,
    Furniture24x24,
    GeneratorSet24x24,
    Logical24x24,
    MainFrame24x24,
    Module24x24,
    MountAccessory24x24,
    Networking24x24,
    OtherDevice24x24,
    PatchPanel24x24,
    PDU24x24,
    PowerGrid24x24,
    PowerModule24x24,
    Power24x24,
    Printer24x24,
    RackChassis24x24,
    RackDoor24x24,
    Rack24x24,
    RFIDLocatorTag24x24,
    RFIDReader24x24,
    RFIDSensorTag24x24,
    RFIDTag24x24,
    Router24x24,
    Security24x24,
    Sensor24x24,
    Server24x24,
    Shelf24x24,
    SmartPDU24x24,
    SNMPGateway24x24,
    Storage24x24,
    SurfaceMountBox24x24,
    Switch24x24,
    Telco24x24,
    UPS24x24,
    UtilityPower24x24,
    WallMountBox24x24,
    Watermark24x24,
    Workstation24x24,
} from "@n20a/libicon";

import type { ComponentType } from "react";

type IconMap = Record<string, ComponentType<any>>;

/** Normalize feature Label the same way menus build icon file names. */
const toFeatureIconKey = (label: string): string =>
    `${label.replace(/[^0-9A-Za-z_-]/g, "")}24x24`;

/** Icons that exist in @n20a/libicon for feature.json Labels. */
const featureIconMap: IconMap = {
    Signout24x24,
    Help24x24,
    Theme24x24,
    ContactUs24x24,
    Profile24x24,
    MyProfile24x24,
    MySubscriptions24x24,
    Buy24x24,
    Purchase24x24,
    Eula24x24,
    MyActivities24x24,
    Manufacturer24x24,
    // Label lookups keep VisioStencils24x24 / NetZoom24x24 / NZIcon24x24 keys.
    VisioStencils24x24: Visio,
    Visio,
    NetZoom24x24: N,
    NZIcon24x24: N,
    N,
    Other24x24,
    Services24x24,
    RequestSupport24x24,
    RequestVisioStencils24x24,
    RequestDeviceModels24x24,
    MyRequests24x24,
    Download24x24,
    DownloadVisioStencils24x24,
    DownloadNetZoom24x24,
    FAQ24x24,
    Cart24x24,
    Orders24x24,
    Details24x24,
    Notes24x24,



    Accessory24x24,
    Appliance24x24,
    AV24x24,
    BladeEnclosure24x24,
    BladeFiber24x24,
    BladeServer24x24,
    BladeStorage24x24,
    Cable24x24,
    Card24x24,
    Chassis24x24,
    CircuitBreaker24x24,
    Connector24x24,
    CoolingUnit24x24,
    Cooling24x24,
    Display24x24,
    Door24x24,
    Enclosure24x24,
    Fan24x24,
    Frame24x24,
    Furniture24x24,
    GeneratorSet24x24,
    Logical24x24,
    MainFrame24x24,
    Module24x24,
    MountAccessory24x24,
    Networking24x24,
    OtherDevice24x24,
    PatchPanel24x24,
    PDU24x24,
    PowerGrid24x24,
    PowerModule24x24,
    Power24x24,
    Printer24x24,
    RackChassis24x24,
    RackDoor24x24,
    Rack24x24,
    RFIDLocatorTag24x24,
    RFIDReader24x24,
    RFIDSensorTag24x24,
    RFIDTag24x24,
    Router24x24,
    Security24x24,
    Sensor24x24,
    Server24x24,
    Shelf24x24,
    SmartPDU24x24,
    SNMPGateway24x24,
    Storage24x24,
    SurfaceMountBox24x24,
    Switch24x24,
    Telco24x24,
    UPS24x24,
    UtilityPower24x24,
    WallMountBox24x24,
    Watermark24x24,
    Workstation24x24,
};

/** Shared icons used by tree/submenu aliases and Settings. */
const sharedIconMap: IconMap = {
    Setting24x24,
    More24x24,
    Info24x24,
    F24x24,
    R24x24,
    ThreeD24x24,
    EntityvsTable24x24,
};

const rawIconMap: IconMap = {
    ...featureIconMap,
    ...sharedIconMap,
};

// normalize once
const iconMap: IconMap = Object.fromEntries(
    Object.entries(rawIconMap).map(([k, v]) => [k.toLowerCase(), v])
);

type ResolverOptions = {
    defaultIcon?: ComponentType<any>;
    aliases?: Record<string, string>;
};

const FnResolveIcons = (options?: ResolverOptions) => {
    try {
        const { defaultIcon = N, aliases = {} } = options || {};

        const normalizedAliases = Object.fromEntries(
            Object.entries(aliases).map(([k, v]) => [
                k.toLowerCase(),
                v.toLowerCase()
            ])
        );

        return (fileName?: string): ComponentType<any> => {
            console.log('fileName FnResolveIcons:', fileName);
            try {
                if (!fileName) return defaultIcon;

                const key = fileName.toLowerCase();
                const resolvedKey = normalizedAliases[key] || key;

                // 1. Exact match first
                if (iconMap[resolvedKey]) {
                    return iconMap[resolvedKey];
                }

                // 2. Find first key that starts with the filename
                const matchedEntry = Object.entries(iconMap).find(([iconKey]) =>
                    iconKey.startsWith(resolvedKey)
                );

                return matchedEntry?.[1] || defaultIcon;
            } catch (error) {
                console.error("FnResolveIcons resolver error:", error);
                return defaultIcon;
            }
        };
    } catch (error) {
        console.error("FnResolveIcons error:", error);
        return (): ComponentType<any> => N;
    }
};


export { FnResolveIcons, N, Setting24x24, toFeatureIconKey };
