/*
instead importing context  
import { HelpTipContext } from './contextandprovider/Helptip';
you should import hook and use the hook to consume the context like below
import { useHelpTip } from './contextandprovider/Helptip';
*/

import { createContext, useEffect, useMemo, useState } from "react";
import { IHelpTip, IHelpTipProperty } from "../allinterface/IHelpTip";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";

// Create a context with default values
const HelpTipContext = createContext<IHelpTip | undefined>(undefined);

function HelpTipProvider({ children }: IAppContextWrapper) {
    const [helpTipRecords, setHelpTipRecords] = useState<IHelpTipProperty[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const abortController = new AbortController();

        const handleApiDataForhelptip = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const helptipDataJson = await fetch("/privatedocs/helptips.json", {
                    cache: "no-store",
                    signal: abortController.signal
                });

                if (!helptipDataJson.ok) {
                    throw new Error(`Failed to fetch help tips: ${helptipDataJson.statusText}`);
                }

                const helptipData = await helptipDataJson.json();

                if (helptipData && Array.isArray(helptipData)) {
                    setHelpTipRecords(helptipData as IHelpTipProperty[]);
                } else {
                    setHelpTipRecords([]);
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    console.error("Help tips fetch aborted");
                } else {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                    console.error("Error fetching help tips:", error);
                    setError(errorMessage);
                    setHelpTipRecords([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        handleApiDataForhelptip();

        return () => {
            abortController.abort();
        };
    }, []);


    const contextValue: IHelpTip = useMemo(() => ({
        helpTipRecords,
        setHelpTipRecords,
        isLoading,
        error
    }), [helpTipRecords, isLoading, error]);

    return (
        <HelpTipContext.Provider value={contextValue}>
            {children}
        </HelpTipContext.Provider>
    );
}

// duplicate-Custom hook for consuming the context
// function useHelpTip() {
//     const context = useContext(HelpTipContext);
//     if (!context) {
//         throw new Error('useHelpTip must be used within HelpTipProvider');
//     }
//     return context;
// }

export { HelpTipContext, HelpTipProvider };
