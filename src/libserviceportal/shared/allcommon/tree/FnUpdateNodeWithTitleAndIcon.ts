
import { IFeatureTree } from "../../allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { TreeNodeIcon } from "../../tree/treenodeicon/TreeNodeIcon";
import { TreeNodeTitle } from "../../tree/treenodetitle/TreeNodeTitle";

// This function updates node with Title and icon 
function FnUpdateNodeWithTitleAndIcon(treeData: ITreeNode[], treeDataProps: IFeatureTree, featureId: string): ITreeNode[] {
    try {

        const updateNodes = (data: ITreeNode[], nodeIndex: number = 0): void => {
            data.forEach((node: ITreeNode, index: number) => {
                // Update the title and icon
                // if (excludeFeaturesFromFilterNodes.includes(featureId) && treeDataProps.indexNumber === 0) {
                //     node.stepNo = nodeIndex + 1;

                // }
                node.NaturalSortorder = index;
                node.title = TreeNodeTitle(node, treeDataProps, featureId);
                if (treeDataProps.allowIcon) {
                    node.icon = TreeNodeIcon(node, treeDataProps.instanceName ?? "");
                }

                // Recursively update the children
                if (node.children && node.children.length > 0) {
                    updateNodes(node.children, nodeIndex + 1);
                }
            });
        };

        // Call the update function on the root nodes
        updateNodes(treeData);
    } catch (error) {
        console.error(
            "Error in function(FnUpdateNodeWithTitleAndIcon): ",
            error
        );
    }
    // Return the updated tree data
    return treeData;
}

export { FnUpdateNodeWithTitleAndIcon }