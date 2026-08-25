
import { FnFormatTicketDateOnly } from "../../../../shared/allcommon/tree/FnFormatTicketDate";
import { ITreeNode } from "../../../../shared/allinterface/entity/ITreeNode";
import { IFeatureTree } from "../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITicketFilterValues } from "../../../../shared/ticketexplorercontainer/TicketFilterForm";
import { ITicket } from "../../../../shared/ticketexplorercontainer/TicketSampleData";
import { TreeNodeIcon } from "../../../../shared/tree/treenodeicon/TreeNodeIcon";
import { TreeNodeTitle } from "../../../../shared/tree/treenodetitle/TreeNodeTitle";

type NodeContext = { featureTreeProps?: IFeatureTree; featureId?: string }

// Main function: filters tickets and builds the tree based on the selected grouping.
function FnBuildTicketTree(tickets: ITicket[], filter: ITicketFilterValues, featureTreeProps?: IFeatureTree, featureId?: string): ITreeNode[] {
    const context = { featureTreeProps, featureId }
    const filteredTickets = filter.showAll ? [...tickets] : tickets.filter(ticket => ticket.Status === "Pending")
    const rootKey = filter.byMfg ? "root##by-mfg" : "root##by-requested-date"
    const rootLabel = filter.byMfg ? "By Mfg" : "By Requested Date"
    const children: ITreeNode[] = []

    if (filter.byMfg) {
        const byMfg = groupBy(filteredTickets, ticket => ticket.Mfg)
            ;[...byMfg.keys()].sort((a, b) => (a ?? "").localeCompare(b ?? "")).forEach(mfg => {
                children.push(createMfgNode(mfg, byMfg.get(mfg) ?? [], `mfg##${mfg}`, rootKey, `prod##${mfg}##`, context))
            })
    } else {
        const byDate = groupBy(filteredTickets, ticket => daySortKey(ticket.DateRequested))
            ;[...byDate.entries()].sort(([a], [b]) => b - a).forEach(([sortKey, dateTickets]) => {
                const dateLabel = formatDateRequested(dateTickets[0]?.DateRequested)
                const dateNode = createNode({ key: `date##${sortKey}`, name: dateLabel, nodeType: "date", parentEntID: rootKey, isLeaf: false, description: `Requested ${dateLabel}` })
                dateNode.title = dateLabel
                dateNode.TableLabel = dateLabel
                const byMfg = groupBy(dateTickets, ticket => ticket.Mfg)
                dateNode.children = [...byMfg.keys()].sort((a, b) => a.localeCompare(b)).map(mfg => createMfgNode(mfg, byMfg.get(mfg) ?? [], `date##${sortKey}##mfg##${mfg}`, dateNode.key, `prod##${sortKey}##${mfg}##`, context))
                children.push(finalizeNode(dateNode, context))
            })
    }

    const rootNode = createNode({ key: rootKey, name: rootLabel, nodeType: "Root", parentEntID: null, isLeaf: children.length === 0, description: rootLabel })
    rootNode.children = children
    return [finalizeNode(rootNode, context)]
}

// Creates an Mfg node and its ProdNo ticket children.
function createMfgNode(mfg: string, tickets: ITicket[], mfgKey: string, parentKey: string, ticketKeyPrefix: string, context: NodeContext): ITreeNode {
    const mfgNode = createNode({ key: mfgKey, name: mfg, nodeType: "Mfg", parentEntID: parentKey, isLeaf: false, description: mfg })
    mfgNode.children = [...tickets].sort((a, b) => (a.ProdNo ?? "").localeCompare(b.ProdNo ?? "")).map(ticket => createTicketNode(ticket, mfgNode.key, `${ticketKeyPrefix}${ticket.ProdNo}##${ticket.Ticket}`, context))
    return finalizeNode(mfgNode, context)
}

// Creates a ProdNo leaf node for a ticket.
function createTicketNode(ticket: ITicket, parentKey: string, key: string, context: NodeContext): ITreeNode {
    return finalizeNode(createNode({ key, name: ticket.ProdNo, nodeType: "ProdNo", parentEntID: parentKey, isLeaf: true, ticket, description: `${ticket.Ticket} · ${ticket.Status}` }), context)
}

// Creates the common tree-node structure used by Root, Date, Mfg and ProdNo nodes.
function createNode(params: { key: string; name: string; nodeType: string; parentEntID: string | null; isLeaf: boolean; ticket?: ITicket; description?: string }): ITreeNode {
    const { key, name, nodeType, parentEntID, isLeaf, ticket, description } = params
    return { key, NodeEntID: key, EntID: key, NodeEntityname: nodeType === "Mfg" ? name : nodeType, NodeType: nodeType, Name: name, TableLabel: name, Description: description ?? name, NodeState: ticket?.Status ?? null, IsAuthorized: false, title: name, icon: null, children: [], treetype: nodeType, Type: nodeType, parentEntID, stepNo: 0, HasChildren: isLeaf ? 0 : 1, isLeaf, checkable: false, ticketRecord: ticket, Status: ticket?.Status }
}

// Applies the feature-specific title and Mfg icon.
function finalizeNode(node: ITreeNode, { featureTreeProps, featureId }: NodeContext): ITreeNode {
    if (featureTreeProps && featureId) {
        node.title = TreeNodeTitle(node, featureTreeProps, featureId, false, false)
        if (featureTreeProps.allowIcon && node.NodeType === "Mfg") node.icon = TreeNodeIcon(node, featureTreeProps.instanceName ?? "")
    } else node.title = node.TableLabel ?? node.Name ?? node.title
    return node
}

// Groups tickets by the requested key.
function groupBy<T, K>(items: T[], getKey: (item: T) => K): Map<K, T[]> {
    const groups = new Map<K, T[]>()
    items.forEach(item => {
        const key = getKey(item)
        const group = groups.get(key)
        group ? group.push(item) : groups.set(key, [item])
    })
    return groups
}

// Converts a requested date to a display string.
function formatDateRequested(value: Date | string | null | undefined): string {
    if (!value) return "Unknown Date"
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return typeof value === "string" && value.trim() ? value.trim() : "Unknown Date"
    const formatted = FnFormatTicketDateOnly(date)
    if (formatted?.trim()) return formatted.trim()
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`
}

// Returns a day-level timestamp so tickets on the same date are grouped together.
function daySortKey(value: Date | string | null | undefined): number {
    if (!value) return 0
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return 0
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// Finds the first ProdNo ticket leaf.
export function findFirstTicketLeaf(nodes: ITreeNode[]): ITreeNode | null {
    for (const node of nodes) {
        if (node.NodeType?.toLowerCase() === "prodno" && node.ticketRecord) return node
        if (node.children?.length) {
            const found = findFirstTicketLeaf(node.children)
            if (found) return found
        }
    }
    return null
}

// Returns all ancestor keys from root to the specified leaf, excluding the leaf.
export function getAncestorKeys(nodes: ITreeNode[], leafKey: string): string[] {
    const path: string[] = []
    const walk = (currentNodes: ITreeNode[], ancestors: string[]): boolean => {
        for (const node of currentNodes) {
            if (node.key === leafKey) {
                path.push(...ancestors)
                return true
            }
            if (node.children?.length && walk(node.children, [...ancestors, node.key])) return true
        }
        return false
    }
    walk(nodes, [])
    return path
}

export { FnBuildTicketTree }