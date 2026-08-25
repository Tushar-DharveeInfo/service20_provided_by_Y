
import { Key } from "rc-tree/lib/interface";
import { ITreeForHierarchicalDataContainer } from "../../allinterface/tree/ITreeForHierarchicalDataContainer";
import { ISelectedNodeInfo, ITreeNode } from "../../allinterface/tree/ITreeControl";
import { TreeNodeTitle } from "../../tree/treenodetitle/TreeNodeTitle";
import { IActionImageForSubMenu } from "../../allinterface/basic/IActionImageList";

// This function will update tree node if HideKebabMenu or HideCopyIcon is false
const FnUpdateTreeNodeBasedOnKeyForHierarchicalData = async (
    treeData: ITreeNode[],            // Hierarchical tree data
    key: Key,                   // Key to match the node
    showCopyIcon: boolean,      // show/hide copy icon
    showKebabIcon: boolean,       // Show tooltip
    treeContainerProps: ITreeForHierarchicalDataContainer,
    selectedNodeExplorer: ISelectedNodeInfo | null = null,   // Explorer node
    handleKebabMenuSelect?: (selectedItem: IActionImageForSubMenu) => void
): Promise<ITreeNode[]> => {
    try {
        // Loop through each node
        for (const item of treeData) {
            // Check if the current node matches the key
            if (item.key === key) {
                // Update the matched node
                item.title = TreeNodeTitle(
                    item,
                    treeContainerProps.featureTreeProps,
                    treeContainerProps.featureId,
                    showKebabIcon,
                    showCopyIcon,
                    selectedNodeExplorer || undefined,
                    handleKebabMenuSelect
                );
                return treeData; // Return updated tree
            }

            // Recursively check children
            if (item.children && item.children.length > 0) {
                await FnUpdateTreeNodeBasedOnKeyForHierarchicalData(
                    item.children,
                    key,
                    showCopyIcon,
                    showKebabIcon,
                    treeContainerProps,
                    selectedNodeExplorer,
                    handleKebabMenuSelect
                );
            }
        }
    } catch (error) {
        console.error(
            "Error in function(FnUpdateTreeNodeBasedOnKeyForHierarchicalData): ",
            error
        );
    }
    // Return updated treeData
    return treeData;
};
export { FnUpdateTreeNodeBasedOnKeyForHierarchicalData }