
import { createContext, useEffect, useMemo, useState } from "react";
import { ICommonVariable, ISessionVars } from "../allinterface/ICommonVariable";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";

let diagnosticLevelData: string | undefined;

const getDiagnosticLevelData = (): string | undefined => diagnosticLevelData;

const CommonVariableContext = createContext<ICommonVariable | undefined>(undefined);

function CommonVariableProvider({ children }: IAppContextWrapper) {
    const [sidebarWidth, setSidebarWidth] = useState<number>(0);
    const [selectedNodeMenu, setSelectedNodeMenu] = useState<any>([]);
    const [reloadTreeFor, setReloadTreeFor] = useState<{ featureId: string, entId: string, dropNodeEntId?: string }>();
    const [diagnosticLevel, setDiagnosticLevel] = useState<string>();
    const [sessionVarsForTreeNode, setSessionVarsForTreeNode] = useState<ISessionVars>();

    useEffect(() => {
        try {
            diagnosticLevelData = diagnosticLevel;
        } catch (error) {
            console.error("Error updating diagnostic level:", error);
        }
    }, [diagnosticLevel]);

    const contextValue = useMemo(() => ({
        sidebarWidth,
        setSidebarWidth,
        selectedNodeMenu,
        setSelectedNodeMenu,
        reloadTreeFor,
        setReloadTreeFor,
        diagnosticLevel,
        setDiagnosticLevel,
        sessionVarsForTreeNode,
        setSessionVarsForTreeNode,
    }), [
        sidebarWidth,
        selectedNodeMenu,
        reloadTreeFor,
        diagnosticLevel,
        sessionVarsForTreeNode,
    ]);

    return (
        <CommonVariableContext.Provider value={contextValue}>
            {children}
        </CommonVariableContext.Provider>
    );
}

export { CommonVariableContext, CommonVariableProvider, getDiagnosticLevelData };
