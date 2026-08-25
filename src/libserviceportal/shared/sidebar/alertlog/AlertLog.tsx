
import { useEffect, useState } from "react";
import { handleNestedZoneContainerKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown';
import { Alertlog, IAlertLogRecord } from "@n20a/libalerts";
import '@n20a/libalerts/style.css'
import { useSessionContext } from "../../context/hooks/SessionHooks";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import sampleAlertLogs from "../../../../serviceSampledata/sidebar/AlertlogSampleData.json";
import { Label } from "../../basic/label/Label";

interface IAlertLog {
    uniqueName: string;
    headerText?: string;
    selectedNode?: ITreeNode;
    handleShowUserMessage?: (messageText: string) => void;
}

const AlertLog = (alertLogProps: IAlertLog) => {
    const [alertRecords, setAlertRecords] = useState<IAlertLogRecord[]>([]);
    const [originalAlertData, setOriginalAlertData] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const sessionContext = useSessionContext();

    useEffect(() => {
        // SAMPLE DATA: ALERT.GetAlertsToProcess API commented out.
        // axiosInterceptor({ ... }, statusBarContext);
        setOriginalAlertData(sampleAlertLogs as unknown as Record<string, any>[]);
        setAlertRecords(sampleAlertLogs);
        setLoading(false);
    }, [alertLogProps.selectedNode?.NodeEntID])

    const handleOnRefreshStatus = async (
    ): Promise<void> => {
        // SAMPLE DATA: ALERT.GetAlertsToProcess refresh API commented out.
        // axiosInterceptor({ ... }, statusBarContext);
        setAlertRecords(sampleAlertLogs);
        setLoading(false);
    };

    const handleAssignToMe = async (
        entityName: string,
        entId: string,
        code: string
    ): Promise<void> => {
        try {
            const loginuser = Array.isArray(sessionContext?.SessionList)
                ? sessionContext.SessionList.find(
                    (item) => item?.VariableName === "LoginShortName"
                )
                : undefined;

            const alertToUpdate = Array.isArray(originalAlertData)
                ? originalAlertData.find((item) => item?.EntID === entId)
                : undefined;

            if (alertToUpdate && loginuser?.SessionValue) {

                try {
                    alertToUpdate.AssignedTo = loginuser?.SessionValue ?? "";
                } catch (err) {
                    console.error("Assign update error:", err);
                }

                // SAMPLE DATA: EM.AddUpdateTableRecord API commented out.
                // The assignment is retained in local state for the sample.
                setAlertRecords((records) => records.map((item) =>
                    item.AlertEntID === entId
                        ? { ...item, AssignedTo: loginuser.SessionValue ?? "" }
                        : item
                ));
                void entityName;
                void code;
            }

        } catch (error) {
            console.error("handleAssignToMe error:", error);
        }
    };

    const handleStatusChange = async (
        entityName: string,
        entId: string,
        code: string
    ): Promise<void> => {
        try {
            const alertToUpdate = Array.isArray(originalAlertData)
                ? originalAlertData.find((item) => item?.EntID === entId)
                : undefined;

            if (alertToUpdate) {
                try {
                    if (code?.toLowerCase() === "close") {
                        alertToUpdate.IsClosed = true;
                    } else {
                        alertToUpdate.IsClosed = false;
                    }
                } catch (err) {
                    console.error("Status update error:", err);
                }

                // SAMPLE DATA: EM.AddUpdateTableRecord API commented out.
                // The status is retained in local state for the sample.
                setAlertRecords((records) => records.map((item) =>
                    item.AlertEntID === entId
                        ? { ...item, IsClosed: code?.toLowerCase() === "close" }
                        : item
                ));
                void entityName;

            }
        } catch (error) {
            console.error("handleStatusChange error:", error);
        }
    };

    if (loading) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">Loading alert logs...</div>;
    }

    if (alertRecords.length === 0) {
        return <div className="nz-wh-100 nz-d-flex-hv-left">No alert logs found</div>;
    }

    return (
        <div className='nz-wh-100 nz-d-flex-column nz-overflow-hidden' tabIndex={1} onKeyDown={handleNestedZoneContainerKeyDown} key={alertLogProps.uniqueName}>
            <div className='nz-sub-header'>
                <Label uniqueName={`${alertLogProps.uniqueName}-task-header`} label={`${alertLogProps.headerText}`} />
            </div>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                <Alertlog alertRecords={alertRecords} onRefreshStatus={handleOnRefreshStatus}
                    onAssignToMe={handleAssignToMe} onStatusChange={handleStatusChange} />
            </div>
        </div>
    )
}

export { AlertLog };
export type { IAlertLog };    