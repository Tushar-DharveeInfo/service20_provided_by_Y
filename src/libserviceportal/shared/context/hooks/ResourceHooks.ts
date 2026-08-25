import { useContext } from "react";
import { ResourceContext } from "../contextandprovider/Resource";

const useResourceContext = () => {
    const context = useContext(ResourceContext);
    if (context === undefined) {
        throw new Error('useResourceContext must be used within a ResourceProvider');
    }
    return context;
};

export { useResourceContext };
