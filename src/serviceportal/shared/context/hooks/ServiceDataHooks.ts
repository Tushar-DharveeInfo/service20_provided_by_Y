import { useContext } from "react";
import { ServiceDataContext } from "../contextandprovider/ServiceData";

const useServiceDataContext = () => {
    const context = useContext(ServiceDataContext);
    if (context === undefined) {
        throw new Error("useServiceDataContext must be used within a ServiceDataProvider");
    }
    return context;
};

// Usage:
// const getStencilName = useGetStencilName();
// const name = getStencilName(eqId);
const useGetStencilName = () => {
    const { getStencilName } = useServiceDataContext();
    return getStencilName;
};

export { useServiceDataContext, useGetStencilName };
