
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { FnBuildRcTreeData } from "./FnBuildRcTreeData";

// This function convert flat data to Hierarchy data by calling  FnBuildRcTreeData function 
const FnConvertFlatDataToHierarchyData = async (flatJSON: any, currentNodeId: string | null = null, featureId: string | null = null, instanceName?: string, disableSort?: boolean) => {
    try {
        let treeData: ITreeNode[] | null = null;
        if (typeof flatJSON === "object") {
            for (let index = 0; index < Object.keys(flatJSON).length; index++) {
                const element: any = Object.values(flatJSON)[index];
                if (element && element.length > 0) {
                    const convertedData = FnBuildRcTreeData(element, currentNodeId, featureId, instanceName, disableSort);
                    treeData = convertedData;
                }
            }
        }
        return treeData;
    } catch (error) {
        console.error(
            "Error in function(FnConvertFlatDataToHierarchyData): ",
            error
        );
        return null;
    }

}

export { FnConvertFlatDataToHierarchyData }