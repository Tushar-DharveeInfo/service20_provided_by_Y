
import { useContext } from "react";
import { CommonVariableContext } from "../contextandprovider/CommonVariable";

const useCommonVariableContext = () => {
    const context = useContext(CommonVariableContext);
    if (context === undefined) {
        throw new Error('useCommonVariableContext must be used within a CommonVariableProvider');
    }
    return context;
};

export { useCommonVariableContext };
