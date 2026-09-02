import { FnFormatTicketDateOnly } from "../../../../shared/allcommon/tree/FnFormatTicketDate";
import { ITreeNode } from "../../../../shared/allinterface/entity/ITreeNode";
import { IFeatureTree } from "../../../../shared/allinterface/tree/ITreeForHierarchicalDataContainer";
import { ITicketFilterValues } from "./TicketFilterForm";
import { ITicketRecord } from "./ITicket";
import { TreeNodeIcon } from "../../../../shared/tree/treenodeicon/TreeNodeIcon";
import { TreeNodeTitle } from "../../../../shared/tree/treenodetitle/TreeNodeTitle";

type NodeContext = {
    featureTreeProps?: IFeatureTree;
    featureId?: string;
};

type DateGroup = {
    dateValue: Date | string | null | undefined;
    manufacturers: Map<string, ITicketRecord[]>;
};


// =========================================================
// MAIN
// =========================================================

function FnBuildTicketTree(
    tickets: ITicketRecord[],
    filter: ITicketFilterValues,
    featureTreeProps?: IFeatureTree,
    featureId?: string
): ITreeNode[] {

    const context: NodeContext = {
        featureTreeProps,
        featureId
    };

    /*
     * Don't clone when showAll is true.
     */
    const filteredTickets = filter.showAll
        ? tickets
        : tickets.filter(
            ticket => ticket.Status === "Pending"
        );

    if (filteredTickets.length === 0) {

        const rootKey = filter.byMfg
            ? "root##by-mfg"
            : "root##by-requested-date";

        const rootLabel = filter.byMfg
            ? "By Mfg"
            : "By Requested Date";

        const rootNode = createNode({
            key: rootKey,
            name: rootLabel,
            nodeType: "Root",
            parentEntID: null,
            isLeaf: true,
            description: rootLabel
        });

        rootNode.children = [];

        return [
            finalizeNode(
                rootNode,
                context
            )
        ];
    }

    const rootKey = filter.byMfg
        ? "root##by-mfg"
        : "root##by-requested-date";

    const rootLabel = filter.byMfg
        ? "By Mfg"
        : "By Requested Date";

    let children: ITreeNode[];

    if (filter.byMfg) {

        children = buildMfgTreeOptimized(
            filteredTickets,
            rootKey,
            context
        );

    } else {

        children = buildDateTreeOptimized(
            filteredTickets,
            rootKey,
            context
        );
    }

    const rootNode = createNode({
        key: rootKey,
        name: rootLabel,
        nodeType: "Root",
        parentEntID: null,
        isLeaf: children.length === 0,
        description: rootLabel
    });

    rootNode.children = children;

    return [
        finalizeNode(
            rootNode,
            context
        )
    ];
}


// =========================================================
// BY MANUFACTURER
// =========================================================

function buildMfgTreeOptimized(
    tickets: ITicketRecord[],
    rootKey: string,
    context: NodeContext
): ITreeNode[] {

    /*
     * Sort ONLY ONCE.
     *
     * The previous implementation sorted each Mfg group
     * independently.
     *
     * Since we group after sorting, every Mfg group retains
     * the required ProdNo ordering.
     */
    const sortedTickets = [...tickets].sort(
        compareProdNo
    );

    /*
     * Group in one pass.
     *
     * Map insertion order is preserved.
     */
    const mfgMap =
        new Map<string, ITicketRecord[]>();

    for (const ticket of sortedTickets) {

        const mfg =
            ticket.Mfg ?? "";

        let group =
            mfgMap.get(mfg);

        if (group) {

            group.push(ticket);

        } else {

            mfgMap.set(
                mfg,
                [ticket]
            );
        }
    }

    /*
     * Manufacturer sorting.
     *
     * This is normally much smaller than ticket sorting.
     */
    const manufacturers =
        Array.from(
            mfgMap.keys()
        ).sort(
            compareString
        );

    const children: ITreeNode[] =
        new Array(manufacturers.length);

    for (
        let i = 0;
        i < manufacturers.length;
        i++
    ) {

        const mfg =
            manufacturers[i];

        const mfgTickets =
            mfgMap.get(mfg)!;

        children[i] =
            createMfgNodeOptimized(
                mfg,
                mfgTickets,
                `mfg##${mfg}`,
                rootKey,
                `prod##${mfg}##`,
                context
            );
    }

    return children;
}


// =========================================================
// BY DATE
// =========================================================

function buildDateTreeOptimized(
    tickets: ITicketRecord[],
    rootKey: string,
    context: NodeContext
): ITreeNode[] {

    /*
     * Date -> Manufacturer -> Tickets
     *
     * Everything is created in ONE grouping pass.
     */
    const dateMap =
        new Map<number, DateGroup>();

    for (const ticket of tickets) {

        const dateKey =
            daySortKey(
                ticket.DateRequested
            );

        let dateGroup =
            dateMap.get(dateKey);

        if (!dateGroup) {

            dateGroup = {
                dateValue:
                    ticket.DateRequested,

                manufacturers:
                    new Map<
                        string,
                        ITicketRecord[]
                    >()
            };

            dateMap.set(
                dateKey,
                dateGroup
            );
        }

        const mfg =
            ticket.Mfg ?? "";

        let mfgTickets =
            dateGroup.manufacturers.get(mfg);

        if (mfgTickets) {

            mfgTickets.push(
                ticket
            );

        } else {

            dateGroup.manufacturers.set(
                mfg,
                [ticket]
            );
        }
    }

    /*
     * Sort dates descending.
     */
    const dateEntries =
        Array.from(
            dateMap.entries()
        );

    dateEntries.sort(
        compareDateDescending
    );

    const children: ITreeNode[] =
        new Array(dateEntries.length);

    for (
        let dateIndex = 0;
        dateIndex < dateEntries.length;
        dateIndex++
    ) {

        const [
            sortKey,
            dateGroup
        ] = dateEntries[dateIndex];

        const dateLabel =
            formatDateRequested(
                dateGroup.dateValue
            );

        const dateNode =
            createNode({
                key:
                    `date##${sortKey}`,

                name:
                    dateLabel,

                nodeType:
                    "date",

                parentEntID:
                    rootKey,

                isLeaf:
                    false,

                description:
                    `Requested ${dateLabel}`
            });

        /*
         * Preserve your existing date node behavior.
         */
        dateNode.title =
            dateLabel;

        dateNode.TableLabel =
            dateLabel;

        /*
         * Sort manufacturers.
         */
        const manufacturers =
            Array.from(
                dateGroup
                    .manufacturers
                    .keys()
            ).sort(
                compareString
            );

        const mfgChildren =
            new Array<ITreeNode>(
                manufacturers.length
            );

        for (
            let mfgIndex = 0;
            mfgIndex < manufacturers.length;
            mfgIndex++
        ) {

            const mfg =
                manufacturers[mfgIndex];

            const mfgTickets =
                dateGroup
                    .manufacturers
                    .get(mfg)!;

            /*
             * IMPORTANT:
             *
             * Tickets inside each group aren't sorted yet.
             *
             * Sort here once for this particular group.
             */
            mfgTickets.sort(
                compareProdNo
            );

            mfgChildren[mfgIndex] =
                createMfgNodeOptimized(
                    mfg,
                    mfgTickets,
                    `date##${sortKey}##mfg##${mfg}`,
                    dateNode.key,
                    `prod##${sortKey}##${mfg}##`,
                    context
                );
        }

        dateNode.children =
            mfgChildren;

        children[dateIndex] =
            finalizeNode(
                dateNode,
                context
            );
    }

    return children;
}


// =========================================================
// MFG NODE
// =========================================================

function createMfgNodeOptimized(
    mfg: string,
    tickets: ITicketRecord[],
    mfgKey: string,
    parentKey: string,
    ticketKeyPrefix: string,
    context: NodeContext
): ITreeNode {

    const mfgNode =
        createNode({
            key:
                mfgKey,

            name:
                mfg,

            nodeType:
                "Mfg",

            parentEntID:
                parentKey,

            isLeaf:
                false,

            description:
                mfg
        });

    /*
     * IMPORTANT:
     *
     * No sorting here.
     *
     * The caller has already sorted the tickets.
     */
    const ticketChildren =
        new Array<ITreeNode>(
            tickets.length
        );

    for (
        let i = 0;
        i < tickets.length;
        i++
    ) {

        const ticket =
            tickets[i];

        ticketChildren[i] =
            createTicketNode(
                ticket,
                mfgNode.key,
                `${ticketKeyPrefix}${ticket.ProdNo}##${ticket.Ticket}`,
                context
            );
    }

    mfgNode.children =
        ticketChildren;

    return finalizeNode(
        mfgNode,
        context
    );
}


// =========================================================
// TICKET NODE
// =========================================================

function createTicketNode(
    ticket: ITicketRecord,
    parentKey: string,
    key: string,
    context: NodeContext
): ITreeNode {

    const node =
        createNode({
            key,
            name:
                ticket.ProdNo,

            nodeType:
                "ProdNo",

            parentEntID:
                parentKey,

            isLeaf:
                true,

            ticket,

            description:
                `${ticket.Ticket} · ${ticket.Status}`
        });

    /*
     * DO NOT REMOVE THIS.
     *
     * TreeNodeTitle() renders the status icon.
     */
    return finalizeNode(
        node,
        context
    );
}


// =========================================================
// CREATE NODE
// =========================================================

function createNode(params: {
    key: string;
    name: string;
    nodeType: string;
    parentEntID: string | null;
    isLeaf: boolean;
    ticket?: ITicketRecord;
    description?: string;
}): ITreeNode {

    const {
        key,
        name,
        nodeType,
        parentEntID,
        isLeaf,
        ticket,
        description
    } = params;

    return {
        key,

        NodeEntID:
            key,

        EntID:
            key,

        NodeEntityname:
            nodeType === "Mfg"
                ? name
                : nodeType,

        NodeType:
            nodeType,

        Name:
            name,

        TableLabel:
            name,

        Description:
            description ?? name,

        NodeState:
            ticket?.Status ?? null,

        IsAuthorized:
            false,

        title:
            name,

        icon:
            null,

        children:
            [],

        treetype:
            nodeType,

        Type:
            nodeType,

        parentEntID,

        stepNo:
            0,

        HasChildren:
            isLeaf
                ? 0
                : 1,

        isLeaf,

        checkable:
            false,

        ticketRecord:
            ticket,

        Status:
            ticket?.Status
    };
}


// =========================================================
// FINALIZE
// =========================================================

function finalizeNode(
    node: ITreeNode,
    context: NodeContext
): ITreeNode {

    const {
        featureTreeProps,
        featureId
    } = context;

    if (
        featureTreeProps &&
        featureId
    ) {

        /*
         * Required for ticket status icons.
         */
        node.title =
            TreeNodeTitle(
                node,
                featureTreeProps
            );

        /*
         * Manufacturer icon.
         */
        if (
            featureTreeProps.allowIcon &&
            node.NodeType === "Mfg"
        ) {

            node.icon =
                TreeNodeIcon(
                    node,
                    featureTreeProps.instanceName ?? ""
                );
        }

    } else {

        node.title =
            node.TableLabel ??
            node.Name ??
            node.title;
    }

    return node;
}


// =========================================================
// COMPARATORS
// =========================================================

function compareString(
    a: string,
    b: string
): number {

    return a.localeCompare(b);
}


function compareProdNo(
    a: ITicketRecord,
    b: ITicketRecord
): number {

    return (
        (a.ProdNo ?? "")
            .localeCompare(
                b.ProdNo ?? ""
            )
    );
}


function compareDateDescending(
    a: [
        number,
        DateGroup
    ],
    b: [
        number,
        DateGroup
    ]
): number {

    return b[0] - a[0];
}


// =========================================================
// DATE FORMAT
// =========================================================

function formatDateRequested(
    value:
        Date |
        string |
        null |
        undefined
): string {

    if (!value) {
        return "Unknown Date";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return (
            typeof value === "string" &&
            value.trim()
        )
            ? value.trim()
            : "Unknown Date";
    }

    const formatted =
        FnFormatTicketDateOnly(
            date
        );

    if (formatted?.trim()) {
        return formatted.trim();
    }

    const pad = (
        n: number
    ) =>
        n.toString().padStart(
            2,
            "0"
        );

    return (
        `${pad(date.getMonth() + 1)}/` +
        `${pad(date.getDate())}/` +
        `${date.getFullYear()}`
    );
}


// =========================================================
// DAY KEY
// =========================================================

function daySortKey(
    value:
        Date |
        string |
        null |
        undefined
): number {

    if (!value) {
        return 0;
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 0;
    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ).getTime();
}


// =========================================================
// FIND FIRST TICKET LEAF
// =========================================================

export function findFirstTicketLeaf(
    nodes: ITreeNode[]
): ITreeNode | null {

    if (!nodes?.length) {
        return null;
    }

    if (nodes.length > 1) {
        return nodes[0];
    }

    let current =
        nodes[0];

    while (
        current.children?.length
    ) {

        if (
            current.children.length === 1
        ) {

            current =
                current.children[0];

        } else {

            current =
                current.children[0];

            break;
        }
    }

    return current;
}


// =========================================================
// GET ANCESTOR KEYS
// =========================================================

export function getAncestorKeys(
    nodes: ITreeNode[],
    leafKey: string
): string[] {

    const path: string[] = [];

    const walk = (
        currentNodes: ITreeNode[],
        ancestors: string[]
    ): boolean => {

        for (
            const node of currentNodes
        ) {

            if (
                node.key === leafKey
            ) {

                path.push(
                    ...ancestors
                );

                return true;
            }

            if (
                node.children?.length &&
                walk(
                    node.children,
                    [
                        ...ancestors,
                        node.key
                    ]
                )
            ) {

                return true;
            }
        }

        return false;
    };

    walk(
        nodes,
        []
    );

    return path;
}


export {
    FnBuildTicketTree
};