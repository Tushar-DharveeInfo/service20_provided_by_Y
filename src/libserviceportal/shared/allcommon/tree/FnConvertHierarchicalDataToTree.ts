
import { Key } from "rc-tree/lib/interface";
import { FnBuildTreeForHierarchicalData } from "./FnBuildTreeForHierarchicalData";
import { FnAutoExpandTreeNodesHierarchy } from "./FnAutoExpandTreeNodesHierarchy";
import { IAutoExpandResult, IConvertedTreeResponse, ISortOptions, ITreeForHierarchicalDataContainer } from "../../allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

//This function loop through the object keys and convert Hierarchical data to tree
const FnConvertHierarchicalDataToTree = async (
    apiData: Record<string, any>,
    treeConatinerProps: ITreeForHierarchicalDataContainer,
    lastModifiedNodeEntID?: string,
    sortOptions?: ISortOptions,
    parentId?: string
) => {
    // Handle invalid or empty data
    if (!apiData || typeof apiData !== 'object' || Object.keys(apiData).length === 0) {
        return undefined;
    }
    try {
        let treeData: ITreeNode[] = [];


        // Process each key in the response data
        for (const key of Object.keys(apiData)) {
            const nodeData = apiData[key];
            if (Array.isArray(nodeData)) {
                // Generate tree data for the explorer
                const respData = await FnBuildTreeForHierarchicalData(
                    nodeData,
                    key,
                    parentId ?? "",
                    treeConatinerProps,
                    sortOptions
                );
                // Assign the response data to variables
                treeData = respData.treeData;
            }
        }
        let expandedKeys: Key[] = [];
        let selectedKey: Key | null = null;
        let selectedNode: ITreeNode | null = null;
        if (treeConatinerProps.featureTreeProps.multiRootNode) {
            selectedKey = treeData[0].key;
            selectedNode = treeData[0];
        }
        else if (lastModifiedNodeEntID) {
            const findNodeAndPath = (
                nodes: ITreeNode[],
                matchFn: (node: ITreeNode) => boolean,
                path: string[] = []
            ): { node: ITreeNode | null; path: string[] } => {
                for (const node of nodes) {
                    const currentPath = [...path, node.key];
                    if (matchFn(node)) {

                        // node.title = TreeNodeTitle(node, treeConatinerProps.featureTreeProps, treeConatinerProps.featureId, !treeConatinerProps.featureTreeProps.hideKebabMenu, !treeConatinerProps.featureTreeProps.hideCopyIcon);
                        return { node, path: currentPath };
                    }
                    if (node.children?.length) {
                        const result = findNodeAndPath(node.children, matchFn, currentPath);
                        if (result.node) {
                            return result;
                        }
                    }
                }
                return { node: null, path: [] };
            };

            const matchFn = (node: ITreeNode) =>
                node.NodeEntID === lastModifiedNodeEntID || node.RecID === lastModifiedNodeEntID;
            const { node, path } = findNodeAndPath(treeData, matchFn);
            if (node) {
                selectedKey = node.key;
                selectedNode = node;
                expandedKeys = path;
            }
        }
        else {
            const expandDetails: IAutoExpandResult = FnAutoExpandTreeNodesHierarchy(treeData)
            expandedKeys = expandDetails.expandedKeys;
            selectedKey = expandDetails.selectedKey;
            selectedNode = expandDetails.selectedNode;
        }
        // Return structured data
        return { treeData, expandedKeys, selectedKey, selectedNode } as IConvertedTreeResponse;
    } catch (error) {
        console.error(
            "Error in function(FnConvertHierarchicalDataToTree): ",
            error
        );
        return undefined;
    }
};
export { FnConvertHierarchicalDataToTree }