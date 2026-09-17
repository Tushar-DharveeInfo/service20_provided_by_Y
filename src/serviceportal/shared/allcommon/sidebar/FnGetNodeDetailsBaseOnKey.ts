import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

let nodeData: { node: ITreeNode } | null = null;
let node: { node: ITreeNode } | null = null;

const FnGetNodeDetailsBaseOnKey = (
    treeData: ITreeNode[],
    key: Key,
    clear?: boolean
) => {
    try {
        // Reset if needed
        if (clear) {
            nodeData = null;
        }

        // Input validation
        if (!Array.isArray(treeData)) {
            return { key, nodeData };
        }

        treeData.forEach((item: ITreeNode) => {
            if (!item || typeof item !== "object") return;

            if (item.key == key) {
                nodeData = { node: item };
                return { key, node }; // kept as-is (no logic change)
            } else {
                if (Array.isArray(item.children)) {
                    FnGetNodeDetailsBaseOnKey(item.children, key);
                }
            }
        });

        return { key, nodeData };

    } catch (error) {
        console.error("FnGetNodeDetailsBaseOnKey error:", error);
        return { key, nodeData };
    }
};

export { FnGetNodeDetailsBaseOnKey }