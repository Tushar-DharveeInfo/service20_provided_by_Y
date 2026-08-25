
import { createContext, useEffect, useMemo, useState } from "react";
import { ICommonVariable, ISessionVars } from "../allinterface/ICommonVariable";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { ITreeNode } from "../../allinterface/entity/ITreeNode";

let sessionVarsTreeNode: ISessionVars | null = null;
let diagnosticLevelData: string | undefined;
let measurementUnit: string | undefined;

const getSessionVarsForTreeNode = (): ISessionVars | null => sessionVarsTreeNode;
const getDiagnosticLevelData = (): string | undefined => diagnosticLevelData;
const getMeasurementUnit = (): string | undefined => measurementUnit;

const CommonVariableContext = createContext<ICommonVariable | undefined>(undefined);

function CommonVariableProvider({ children }: IAppContextWrapper) {
    const [menuOpenName, setMenuOpenName] = useState<string | null>(null);
    const [measurement, setMeasurement] = useState<string | null>(null);
    const [isDcmConsoleLoaded, setIsDcmConsoleLoaded] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(0);
    const [dragNodeDetails, setDragNodeDetails] = useState<ITreeNode[]>([]);
    const [selectedNodeMenu, setSelectedNodeMenu] = useState<any>([]);
    const [reloadTreeFor, setReloadTreeFor] = useState<{ featureId: string, entId: string }>();
    const [searchKeywordForTree, setSearchKeywordForTree] = useState<string>();
    const [cablingHideColumnObject, setCablingHideColumnObject] = useState<{ fromPort: boolean, cable: boolean, toDevicePort: boolean }>();
    const [diagnosticLevel, setDiagnosticLevel] = useState<string>();
    const [isReloadDataForGrid, setIsReloadDataForGrid] = useState<string>();
    const [sessionVarsForTreeNode, setSessionVarsForTreeNode] = useState<ISessionVars>();
    const [chartProfile, setChartProfile] = useState<any>();
    const [hideFloorLayout, setHideFloorLayout] = useState<boolean>();

    useEffect(() => {
        try {
            sessionVarsTreeNode = sessionVarsForTreeNode ?? null;
        } catch (error) {
            console.error("Error updating session vars:", error);
        }
    }, [sessionVarsForTreeNode]);

    useEffect(() => {
        try {
            diagnosticLevelData = diagnosticLevel;
        } catch (error) {
            console.error("Error updating diagnostic level:", error);
        }
    }, [diagnosticLevel]);

    useEffect(() => {
        try {
            measurementUnit = measurement ?? undefined;
        } catch (error) {
            console.error("Error updating measurement unit:", error);
        }
    }, [measurement]);

    const contextValue = useMemo(() => ({
        menuOpenName,
        setMenuOpenName,
        measurement,
        setMeasurement,
        isDcmConsoleLoaded,
        setIsDcmConsoleLoaded,
        sidebarWidth,
        setSidebarWidth,
        dragNodeDetails,
        setDragNodeDetails,
        selectedNodeMenu,
        setSelectedNodeMenu,
        reloadTreeFor,
        setReloadTreeFor,
        searchKeywordForTree,
        setSearchKeywordForTree,
        cablingHideColumnObject,
        setCablingHideColumnObject,
        diagnosticLevel,
        setDiagnosticLevel,
        isReloadDataForGrid,
        setIsReloadDataForGrid,
        sessionVarsForTreeNode,
        setSessionVarsForTreeNode,
        chartProfile,
        setChartProfile,
        hideFloorLayout,
        setHideFloorLayout,
    }), [
        menuOpenName,
        measurement,
        isDcmConsoleLoaded,
        sidebarWidth,
        dragNodeDetails,
        selectedNodeMenu,
        reloadTreeFor,
        searchKeywordForTree,
        cablingHideColumnObject,
        diagnosticLevel,
        isReloadDataForGrid,
        sessionVarsForTreeNode,
        chartProfile,
        hideFloorLayout
    ]);

    return (
        <CommonVariableContext.Provider value={contextValue}>
            {children}
        </CommonVariableContext.Provider>
    );
}


export { CommonVariableContext, CommonVariableProvider, getSessionVarsForTreeNode, getDiagnosticLevelData, getMeasurementUnit };
