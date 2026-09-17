
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { IAutoExpandResult } from "../../allinterface/tree/ITreeForHierarchicalDataContainer";

// This function auto expand tree nodes based on the logic of children===1
const FnAutoExpandTreeNodesHierarchy = (
    treeData: ITreeNode[],
    isRootNode: boolean = true
): IAutoExpandResult => {
    try {
        const expandedKeys: Key[] = [];
        let selectedKey: Key | null = null;
        let selectedNode: ITreeNode | null = null;
        const traverseTree = (nodes: ITreeNode[], isRoot: boolean): boolean => {
            for (const node of nodes) {
                // Always include the root node if it has exactly one child
                if (isRoot || (node.children && node.children.length === 1) || !node.children.length) {
                    expandedKeys.push(node.key);

                    selectedKey = node.key; // Select the first valid node
                    selectedNode = node;
                }

                // If the node has more than one child, select the first child and stop expanding
                if (node.children && node.children.length > 1) {
                    expandedKeys.push(node.key);
                    selectedKey = node.children[0].key; // Set first child's key as selected
                    selectedNode = node.children[0];
                    return true; // Stop further traversal
                }

                // Recursively process children if available
                if (node.children && node.children.length > 0) {
                    const shouldStop = traverseTree(node.children, false);
                    if (shouldStop) return true; // Stop recursion if condition is met
                }
            }
            return false; // Continue traversal
        };

        traverseTree(treeData, isRootNode);

        return {
            expandedKeys,
            selectedKey: selectedKey ?? "",
            selectedNode: selectedNode || null
        };
    } catch (error) {
        console.error(
            "Error in function(FnAutoExpandTreeNodesHierarchy): ",
            error
        );
        return {
            expandedKeys: [],
            selectedKey: "",
            selectedNode: null
        };
    }
};
export { FnAutoExpandTreeNodesHierarchy }