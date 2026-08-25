
import { useState, createContext, useMemo } from "react";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { ISelectedNode, ISelectedNodeProperty } from "../allinterface/ISelectedNode";

const SelectedNodeContext = createContext<ISelectedNode | undefined>(undefined);

function SelectedNodeProvider({ children }: IAppContextWrapper) {
    const [selectedNode, setSelectedNode] = useState<ITreeNode>();
    const [selectedNodeProperty, setSelectedNodeProperty] = useState<ISelectedNodeProperty>();
    const [selectedNodeExplorer, setSelectedNodeExplorer] = useState<ITreeNode>();

    const contextValue = useMemo(() => ({
        selectedNode,
        selectedNodeProperty,
        selectedNodeExplorer,
        setSelectedNode,
        setSelectedNodeProperty,
        setSelectedNodeExplorer,
    }), [
        selectedNode,
        selectedNodeProperty,
        selectedNodeExplorer,
    ]);

    return (
        <SelectedNodeContext.Provider value={contextValue}>
            {children}
        </SelectedNodeContext.Provider>
    );
}

export { SelectedNodeProvider, SelectedNodeContext };
