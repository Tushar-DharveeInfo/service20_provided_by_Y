
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

// This function finds parent node based on current node key
const FnFindParentNode = (
  treeData: ITreeNode[],
  targetKey: Key,
  parent: ITreeNode | null = null
): ITreeNode | null => {
  try {

    for (const node of treeData) {
      if (node.key === targetKey) {
        return parent; // Return the parent when the target node is found
      }
      if (node.children && node.children.length > 0) {
        const foundParent = FnFindParentNode(node.children, targetKey, node);
        if (foundParent) return foundParent; // Return the found parent
      }
    }
    return null; // Return null if no parent is found
  } catch (error) {
    console.error(
      "Error in function(FnFindParentNode): ",
      error
    );
    return null;
  }
};

export { FnFindParentNode }