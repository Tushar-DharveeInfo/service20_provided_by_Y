/*
instead importing context  
import { HelpTipContext } from './contextandprovider/Helptip';
you should import hook and use the hook to consume the context like below
import { useHelpTip } from './contextandprovider/Helptip';
*/

import { createContext, useEffect, useMemo, useState } from "react";
import { useFileDownload } from "@n20a/libfsdb";
import { IHelpTip, IHelpTipProperty } from "../allinterface/IHelpTip";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";

const HELPTIP_BUCKET = 'n20-bucket-01';
const HELPTIP_BASE_FOLDER = 'sm';
const HELPTIP_FILENAME = 'help/helptips-service.json';
const HELPTIP_STORAGE_PATH = `${HELPTIP_BUCKET}/${HELPTIP_BASE_FOLDER}/${HELPTIP_FILENAME}`;

// Create a context with default values
const HelpTipContext = createContext<IHelpTip | undefined>(undefined);

function HelpTipProvider({ children }: IAppContextWrapper) {
    const [helpTipRecords, setHelpTipRecords] = useState<IHelpTipProperty[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { downloadSingleFile } = useFileDownload();

    useEffect(() => {
        let isMounted = true;
        let blobUrl: string | undefined;

        const handleApiDataForhelptip = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const result = await downloadSingleFile(HELPTIP_STORAGE_PATH);

                if (!result?.success || !result.blobUrl) {
                    throw new Error('Failed to fetch help tips.');
                }

                blobUrl = result.blobUrl;
                const response = await fetch(result.blobUrl);
                const helptipData = await response.json();

                if (!isMounted) return;

                if (helptipData && Array.isArray(helptipData)) {
                    setHelpTipRecords(helptipData as IHelpTipProperty[]);
                } else {
                    setHelpTipRecords([]);
                }
            } catch (error) {
                if (isMounted) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                    console.error("Error fetching help tips:", error);
                    setError(errorMessage);
                    setHelpTipRecords([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        handleApiDataForhelptip();

        return () => {
            isMounted = false;
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [downloadSingleFile]);


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
