import { ITreeNode } from "../../allinterface/tree/ITreeControl";

/**
 * Determines whether a tree node represents the root node (e.g. root "Businesses" node).
 * In SM20, root nodes such as the Businesses root node should not display the sidebar or property pane.
 */
export const FnIsRootBusinessNode = (node?: ITreeNode | null): boolean => {
    if (!node) return false;

    const nodeType = (node.NodeType ?? node.Type ?? node.treetype ?? "").toString().trim().toLowerCase();
    const nodeName = (node.Name ?? node.title ?? node.bname ?? "").toString().trim().toLowerCase();
    const key = (node.key ?? node.NodeEntID ?? node.EntID ?? "").toString().trim().toLowerCase();
    const entityName = (node.NodeEntityname ?? "").toString().trim().toLowerCase();
    const description = (node.Description ?? "").toString().trim().toLowerCase();

    // Explicit Root types
    if (
        nodeType === "root" ||
        nodeType === "alldatacenters" ||
        entityName === "root" ||
        entityName === "alldatacenters"
    ) {
        return true;
    }

    // Key patterns for root / root-businesses
    if (
        key === "root-businesses" ||
        key === "root_businesses" ||
        key === "root" ||
        key.startsWith("root##") ||
        key.startsWith("root_") ||
        key.startsWith("root-")
    ) {
        return true;
    }

    // Node name is "businesses" or "root: businesses"
    if (
        (nodeName === "businesses" || nodeName === "root: businesses" || description === "businesses") &&
        (node.parentEntID === null || node.parentEntID === undefined || node.parentEntID === "" || nodeType === "root" || key.includes("root"))
    ) {
        return true;
    }

    return false;
};
