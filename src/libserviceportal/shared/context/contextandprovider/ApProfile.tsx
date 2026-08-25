
import { useState, createContext, useMemo, useCallback } from "react";
import { IApProfile, IApProfileItem } from "../allinterface/IApProfile";
import { IAppContextWrapper } from "../allinterface/IAppContextWrapper";
import { FnHandleAPIResponse } from "../../allcommon/basic/FnHandleAPIResponse";
import { IStatusBar } from "../allinterface/IStatusBar";

const ApProfileContext = createContext<IApProfile | undefined>(undefined);

function ApProfileProvider({ children }: IAppContextWrapper) {
    const [apProfileRecords, setApProfileRecords] = useState<IApProfileItem[] | []>();

    const fetchApProfile = useCallback(async (reCall?: boolean, statusBarContext?: IStatusBar) => {
        const handleApProfileData = async (apProfileResponse: any) => {
            try {
                const parsedData = FnHandleAPIResponse(apProfileResponse, "Dataset");

                if (typeof parsedData === "object" && parsedData["PG.APProfile"]) {
                    setApProfileRecords(parsedData["PG.APProfile"]);
                }
            } catch (error) {
                console.error("Error processing AP profile data:", error);
                setApProfileRecords([]);
            }
        };

        // Trigger fetch regardless of existing records if reCall is true
        // if (statusBarContext && (reCall || (!apProfileRecords || apProfileRecords.length === 0))) {
        //     try {
        //         await axiosInterceptor({
        //             url: EM.GetEntityRecords,
        //             data: {
        //                 entityName: "AP",
        //                 tableName: "PG.APProfile",
        //                 entIDs: ""
        //             },
        //             setFetchData: handleApProfileData
        //         }, statusBarContext);
        //     } catch (error) {
        //         console.error("Error fetching AP profile:", error);
        //         setApProfileRecords([]);
        //     }
        // }
    }, [apProfileRecords]);

    const providers: IApProfile = useMemo(() => ({
        apProfileRecords,
        setApProfileRecords,
        fetchApProfile
    }), [apProfileRecords, fetchApProfile]);

    return (
        <ApProfileContext.Provider value={providers} >
            {children}
        </ApProfileContext.Provider>
    );
}

export { ApProfileContext };
export { ApProfileProvider };
