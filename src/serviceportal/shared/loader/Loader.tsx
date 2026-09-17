
import { useEffect } from "react";
import { useStatusBarContext } from "../context/hooks/StatusBarHooks"

const Loader = () => {
    const statusBarContext = useStatusBarContext();
    useEffect(() => {
        statusBarContext.setIsLoading(true);

        return () => {
            statusBarContext.setIsLoading(false);
        }
    }, [])

    return null
}
export { Loader }