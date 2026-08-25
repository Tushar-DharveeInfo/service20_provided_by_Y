
import { Key } from "rc-tree/lib/interface";
import { FnCreateTreeNode } from "./FnCreateTreeNode";
import { ISortOptions, ITreeForHierarchicalDataContainer } from "../../allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { TreeNodeTitle } from "../../tree/treenodetitle/TreeNodeTitle";
import { TreeNodeIcon } from "../../tree/treenodeicon/TreeNodeIcon";

const FnBuildTreeForHierarchicalData = async (
    nodeData: any,
    treeType: string,
    parentId: Key,
    treeContainerProps: ITreeForHierarchicalDataContainer,
    sortOptions?: ISortOptions
) => {
    try {
        const generateUID = async (): Promise<string> => {
            const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            return Promise.resolve(uid);
        };

        const treeData: ITreeNode[] = [];

        if (nodeData?.length) {
            for (let index = 0; index < nodeData.length; index++) {
                const element = nodeData[index];



                const nodeKey =
                    treeContainerProps.allowGenerateUID ? await generateUID() :
                        treeContainerProps.allowUseParentIDForKey && parentId ? `${element.EntID}##${parentId}` :
                            element.EntID ? element.EntID : await generateUID();

                const treeNode: ITreeNode | null = await FnCreateTreeNode(
                    treeType,
                    element,
                    nodeKey,
                    parentId
                );
                if (!treeNode) continue;

                if (treeNode) {
                    treeNode.title = TreeNodeTitle(treeNode, treeContainerProps.featureTreeProps, treeContainerProps.featureId, false, false);
                    if (treeContainerProps.featureTreeProps.allowIcon) {
                        treeNode.icon = TreeNodeIcon(treeNode, treeContainerProps.featureTreeProps.instanceName ?? "");
                    }
                }

                // Process child nodes recursively
                for (const childKey of Object.keys(element)) {
                    const childData: any = element[childKey];
                    if (Array.isArray(childData)) {

                        const cData = await FnBuildTreeForHierarchicalData(
                            childData,
                            childKey,
                            element.EntID || nodeKey,
                            treeContainerProps,
                            sortOptions // pass down sort options
                        );
                        treeNode.HasChildren = element.HasChildren ?? cData.treeData.length;
                        treeNode.isLeaf = element.HasChildren ? false : cData.treeData.length > 0 ? false : true;
                        treeNode.children.push(...cData.treeData);
                    }
                }

                treeData.push(treeNode);
            }

            // Apply optional sorting
            if (sortOptions?.enabled && sortOptions.sortBy) {
                const key = sortOptions.sortBy;
                const descending = sortOptions.descending ?? false;

                treeData.sort((a, b) => {
                    const valA = String(a[key] ?? "");
                    const valB = String(b[key] ?? "");

                    const result = valA.localeCompare(valB, undefined, {
                        sensitivity: "accent" // case-insensitive
                    });

                    return descending ? -result : result;
                });
            }
        }

        return {
            treeData
        };
    } catch (error) {
        console.error(
            "Error in function(FnBuildTreeForHierarchicalData): ",
            error
        );
        return {
            treeData: []
        }
    }
};

export { FnBuildTreeForHierarchicalData }