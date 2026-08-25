
import { useContext, useEffect } from "react";
import { ApProfileContext } from "../contextandprovider/ApProfile";
import { useStatusBarContext } from "./StatusBarHooks";

const useApProfileContext = () => {
    const context = useContext(ApProfileContext);
    if (context === undefined) {
        throw new Error('useApProfileContext must be used within an ApProfileProvider');
    }

    const statusBarContext = useStatusBarContext();

    useEffect(() => {
        context.fetchApProfile(false, statusBarContext); // auto-trigger on first hook use
    }, []);

    return context;
};

export { useApProfileContext };
