
import { useContext } from "react";
import { SelectedNodeContext } from "../contextandprovider/SelectedNode";

const useSelectedNodeContext = () => {
    const context = useContext(SelectedNodeContext);
    if (context === undefined) {
        throw new Error('useSelectedNodeContext must be used within a SelectedNodeProvider');
    }
    return context;
};

export { useSelectedNodeContext };
