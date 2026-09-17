
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// This function returns all keys of the nodes to set default expand all 
const FnGetAllKeysOfTree = (nodes: ITreeNode[]) => {
    try {
        const keys: Key[] = [];
        const traverse = (data: ITreeNode[]) => {
            data.forEach((node) => {
                keys.push(node.key);
                if (node.children) traverse(node.children);
            });
        };
        traverse(nodes);
        return keys;
    } catch (error) {
        console.error(
            "Error in function(FnGetAllKeysOfTree): ",
            error
        );
        return [];
    }
};

export { FnGetAllKeysOfTree }