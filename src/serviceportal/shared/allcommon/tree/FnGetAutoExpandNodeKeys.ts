
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// This function returns the expanded and selectedNode data
const FnGetAutoExpandNodeKeys = async (treeData: ITreeNode[]) => {
    const keysToExpand: Key[] = [];
    let nodeToSelect: ITreeNode | null = null;
    try {
        const getAutoExpandNodeKeys = (treeData: ITreeNode[], isClear: boolean, keysToExpand: Key[]) => {
            if (isClear) {
                keysToExpand.length = 0; // Clear the keys array
                keysToExpand.push(treeData[0].key);
            }

            for (const item of treeData) {
                if (item.children?.length === 1) {
                    if (item.children[0].children?.length > 0) {
                        keysToExpand.push(item.children[0].key);
                    }
                    getAutoExpandNodeKeys(item.children, false, keysToExpand);
                }
                else {
                    if (item.children?.length) {
                        nodeToSelect = item.children[0];
                    }
                    else {
                        nodeToSelect = item;
                    }
                }
            }
        };

        getAutoExpandNodeKeys(treeData, true, keysToExpand);
        return { keysToExpand, nodeToSelect };
    } catch (error) {
        console.error(
            "Error in function(FnFindParentNode): ",
            error
        );
        return { keysToExpand: [], nodeToSelect: null }
    }
}

export { FnGetAutoExpandNodeKeys }