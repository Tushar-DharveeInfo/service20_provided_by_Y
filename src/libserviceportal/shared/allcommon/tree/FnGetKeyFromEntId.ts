
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

let key: string | number = "";
let node: { node: any } | null = null;

// get node data base on key or entid
const FnGetKeyFromEntId = (
  treeData: ITreeNode[],
  entId: string,
  isClear: boolean = false
) => {
  try {
    if (isClear) {
      key = "";
      node = null;
    }

    if (!Array.isArray(treeData) || !treeData.length) {
      return { key, node };
    }

    if (entId === null && key === "") {
      if (treeData[0]) {
        key = treeData[0].key;
        node = { node: treeData[0] };
      }

      return { key, node };
    }

    for (const item of treeData) {
      try {
        if (!item) {
          continue;
        }

        if (
          item.NodeEntID === entId ||
          item.Name === entId
        ) {
          key = item.key;
          node = { node: item };

          return { key, node };
        }

        if (
          item.children &&
          Array.isArray(item.children) &&
          node === null
        ) {
          FnGetKeyFromEntId(
            item.children,
            entId
          );
        }
      } catch (itemError) {
        console.error(
          "Error processing tree node:",
          itemError
        );
      }
    }

    return { key, node };
  } catch (error) {
    console.error(
      "Error in get key from entid:",
      error
    );

    return {
      key: "",
      node: null
    };
  }
};

export { FnGetKeyFromEntId };