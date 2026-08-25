
import { Key } from "rc-tree/lib/interface";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
import { IApiElement } from "../../allinterface/tree/ITreeForHierarchicalDataContainer";

// This function tree node from the data object 
const FnCreateTreeNode = async (
  treeType: string,
  element: IApiElement,
  nodeKey: string,
  parentEntID: Key,
) => {
  try {

    const removeArrayKeys = (input: object | string): object => {
      let obj: any;

      // If input is a JSON string, parse it
      try {
        obj = typeof input === 'string' ? JSON.parse(input) : input;
      } catch {
        console.error("Invalid JSON string.");
        return {};
      }

      const result: any = {};

      Object.entries(obj).forEach(([key, value]) => {
        if (!Array.isArray(value)) {
          result[key] = value;
        }
      });

      return result;
    };

    const knownKeys = new Set([
      "NodeEntID", "NodeEntityname", "EntID", "Name", "Description", "NodeState",
      "HasChildren", "Secured", "RecordCount", "IsNZ", "type"
    ]);

    const filteredElement = Object.fromEntries(
      Object.entries(element).filter(
        ([key, value]) => !Array.isArray(value) && !knownKeys.has(key)
      )
    );
    const data: ITreeNode = {
      ...filteredElement,
      key: nodeKey,
      NodeEntityname: element.EntityName,
      NodeEntID: element.NodeEntID ? element.NodeEntID as string : element.EntID,
      parentEntID: parentEntID as string,
      NodeState: element.NodeState || null,
      Description: element.Description || null,
      checkable: false,
      title: element.Name ? element.Name : "",
      icon: null,
      children: [],
      treetype: treeType,
      Name: element.Name ? element.Name.trim() : "",
      type: element.type,
      HasChildren: element.HasChildren || 0,
      IsNZ: element?.IsNZ,
      Secured: element?.Secured,
      RecordCount: element.RecordCount || -1,
      stepNo: 0,
      Type: element.Type ? element.Type as string : null,
      EntID: element.EntID,
      isLeaf: element.HasChildren ? false : undefined,
      NodeDetail: JSON.stringify(removeArrayKeys(element))

    };

    // Handle node states
    const stateClassMap: Record<string, string> = {
      Discoverable: "ng-yellow-check",
      Discovered: "ng-blue-check",
      Monitored: "ng-green-check",
      "Critical Alert": "ng-red-check",
      Queued: "ng-grey-check",
    };

    if (
      element.NodeState &&
      stateClassMap[element.NodeState as keyof typeof stateClassMap] // Cast key type
    ) {
      data.className = stateClassMap[element.NodeState as keyof typeof stateClassMap];
    }

    return data;
  } catch (error) {
    console.error(
      "Error in function(FnCreateTreeNode): ",
      error
    );
    return null;
  }
};
export { FnCreateTreeNode }