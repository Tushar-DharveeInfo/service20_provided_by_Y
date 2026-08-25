
import { useContext } from "react";
import { HelpTipContext } from "../contextandprovider/Helptip";

const useHelpTipContext = () => {
    const context = useContext(HelpTipContext);
    if (context === undefined) {
        throw new Error('useHelpTipContext must be used within a HelpTipProvider');
    }
    return context;
};

export { useHelpTipContext };
