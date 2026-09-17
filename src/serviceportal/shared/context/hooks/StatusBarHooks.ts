
import { useContext } from "react";
import { StatusBarContext } from "../contextandprovider/StatusBar";

const useStatusBarContext = () => {
    const context = useContext(StatusBarContext);
    if (context === undefined) {
        throw new Error('useStatusBarContext must be used within a StatusBarProvider');
    }
    return context;
};

export { useStatusBarContext };
