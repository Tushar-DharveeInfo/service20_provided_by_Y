import { ITreeNode } from "../../allinterface/tree/ITreeControl";


// this function locally search keyword in the tree node by traversing it
function FnSearchKeywordInLocalTree(
    searchText: string,
    treeData: ITreeNode[],
    excludeEntIDs: string[],
    parentNodes: ITreeNode[] = []
): { foundNode: ITreeNode | null, parentNodes: ITreeNode[] } {
    try {
        for (const node of treeData) {
            // Check if the searchText matches the Name
            if (node.Name && node.Name?.toLowerCase() === searchText?.toLowerCase()) {
                if ((node.NodeEntID && excludeEntIDs.includes(node.NodeEntID)) || excludeEntIDs.includes(node.key)) {
                    continue;
                } else {
                    return { foundNode: node, parentNodes };
                }
            }
            else if (node.NodeEntID && node.NodeEntID?.toLowerCase().includes(searchText?.toLowerCase())) {
                if ((node.NodeEntID && excludeEntIDs.includes(node.NodeEntID)) || excludeEntIDs.includes(node.key)) {
                    continue;
                } else {
                    return { foundNode: node, parentNodes };
                }
            }

            // If the node has children, traverse them recursively
            if (node.children && node.children.length > 0) {
                const result = FnSearchKeywordInLocalTree(searchText, node.children, excludeEntIDs, [...parentNodes, node]);
                if (result.foundNode) {
                    return result;
                }
            }
        }
    } catch (error) {
        console.error(
            "Error in function(FnSearchKeywordInLocalTree): ",
            error
        );
    }
    // Return null if no matching node is found
    return { foundNode: null, parentNodes: [] };
}

export { FnSearchKeywordInLocalTree }