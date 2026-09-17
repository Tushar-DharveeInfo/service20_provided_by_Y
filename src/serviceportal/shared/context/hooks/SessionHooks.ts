
import { useContext } from "react";
import { SessionContext } from "../contextandprovider/Session";

const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSessionContext must be used within a SessionProvider');
    }
    return context;
};

export { useSessionContext };
