import { useEffect, useMemo, useState } from 'react'
import { Key } from 'rc-tree/lib/interface'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import './MyRequests.css';
import { useFetchTickets } from './tickets/Tickets'
import { FnBuildTicketTree, findFirstTicketLeaf, getAncestorKeys } from './tickets/FnBuildTicketTree'

import { FnSearchKeywordInLocalTree } from '../../../shared/allcommon/tree/FnSearchKeywordInLocalTree'
import { ISelectedNodeInfo, ITreeNode } from '../../../shared/allinterface/tree/ITreeControl'
import { SearchControl } from '../../../shared/searchfilter/searchcontrol/SearchControl'
import { TreeControl } from '../../../shared/tree/treecontrol/TreeControl'
import { TicketDetailPane } from './tickets/TicketDetailPane'
import { TicketFilterForm, type ITicketFilterValues } from './tickets/TicketFilterForm'
import { Label } from '../../../shared/basic/label/Label';
import { sampleTickets } from '../../../shared/ticketexplorercontainer/TicketSampleData';
import { ITicketRecord } from './tickets/ITicket';

interface IFeatureTree {
    hideKebabMenu?: boolean;// if true kebab menu on node will not show
    allowCheckbox?: boolean;// Whether checkboxes are enabled for nodes
    allowIcon?: boolean;// Whether icons should be displayed for nodes
    hideCopyIcon?: boolean;// if true copy icon on node will not show
    reuseFromCache?: boolean;// whether to reuse from cache but it will used for treeContainerForFlatData
    instanceName?: string;// instancename for the tree unique to apply condition if needed
    isAllowDrag?: boolean;// to allow drag on node
    isAllowDrop?: boolean;// to allow drop on node
    allowCheckStrictly?: boolean;// Whether checkboxes follow strict hierarchy rules
    allowInternalDrag?: boolean | undefined;// Whether internal drag-and-drop is enabled
    multiRootNode?: boolean;// whether tree is multiroot or not
    openAllNodes?: boolean;// Whether all nodes should be expanded by default
    allowCustomCheck?: boolean;//If true user need to handle handleCheck event 
    disableSelection?: boolean;// Disable selection of node
    showLeafStatusIcon?: boolean;
}

interface IMyRequestsContainer {
    uniqueName: string
    headerText: string
    featureId?: string
}

const DEFAULT_FILTER: ITicketFilterValues = {
    showAll: true,
    byMfg: true,
}

function buildFeatureTreeProps(): IFeatureTree {
    return {
        hideKebabMenu: true,
        allowCheckbox: false,
        allowIcon: true,
        hideCopyIcon: true,
        reuseFromCache: false,
        instanceName: 'dc_explorer_tree',
        isAllowDrag: false,
        isAllowDrop: false,
        allowCheckStrictly: false,
        allowInternalDrag: false,
        multiRootNode: false,
        openAllNodes: false,
        allowCustomCheck: false,
        disableSelection: false,
        showLeafStatusIcon: true,
    }
}

const MyRequests = (myRequestsProps: IMyRequestsContainer) => {
    const featureTreeProps = useMemo(() => buildFeatureTreeProps(), [])
    const [treeData, setTreeData] = useState<ITreeNode[]>([])
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([])
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([])
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null)

    const [selectedTicket, setSelectedTicket] = useState<ITicketRecord | null>(null)
    const [searchText, setSearchText] = useState('')
    const [searchHistory, setSearchHistory] = useState<string[]>([])
    const [isShowFilterForm, setIsShowFilterForm] = useState(false)
    const [isFilterChange, setIsFilterChange] = useState(false)
    const [appliedFilter, setAppliedFilter] = useState<ITicketFilterValues>(DEFAULT_FILTER)
    const [draftFilter, setDraftFilter] = useState<ITicketFilterValues>(DEFAULT_FILTER)

    const { tickets, error, loading, fetchTickets } = useFetchTickets();

    const selectLeaf = (
        node: ITreeNode,
        expandedKeys: Key[],
        currentTree: ITreeNode[],
        event: ISelectedNodeInfo['event'] = 'auto-select'
    ) => {
        const info: ISelectedNodeInfo = {
            event,
            selected: true,
            node,
            selectedNodes: [node],
        }
        setDefaultSelectedKeys([node.key])
        setDefaultSelectedNodeInfo(info)
        setSelectedTicket((node.ticketRecord as ITicketRecord) ?? null)

    }

    const setTicketTree = (filter: ITicketFilterValues) => {
        const nodes = FnBuildTicketTree(
            tickets,
            filter,
            featureTreeProps,
            myRequestsProps.featureId ?? 'ticket-explorer'
        )
        setTreeData(nodes)
        const firstLeaf = findFirstTicketLeaf(nodes)
        if (firstLeaf) {
            const ancestors = getAncestorKeys(nodes, firstLeaf.key)
            setDefaultExpandedKeys(ancestors)
            selectLeaf(firstLeaf, ancestors, nodes)
        } else {
            setDefaultExpandedKeys([])
            setDefaultSelectedKeys([])
            setDefaultSelectedNodeInfo(null)
            setSelectedTicket(null)
        }
    }

    useEffect(() => {
        fetchTickets({
            collectionName: 'tickets',
        });
    }, []);

    // Rebuild tree once tickets data has loaded
    useEffect(() => {
        if (!loading && tickets.length > 0) {
            setTicketTree(appliedFilter)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tickets, loading])

    const handleFilterClick = () => {
        if (isShowFilterForm) {
            if (isFilterChange) {
                setAppliedFilter(draftFilter)
                setTicketTree(draftFilter)
            }
            setIsFilterChange(false)
            setIsShowFilterForm(false)
            return
        }
        setDraftFilter(appliedFilter)
        setIsShowFilterForm(true)
    }

    const handleFilterActionClick = (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => {
        if (!event) return
        if (actionCode === 'close') {
            setDraftFilter(DEFAULT_FILTER)
            setAppliedFilter(DEFAULT_FILTER)
            setIsFilterChange(false)
            setIsShowFilterForm(false)
            setTicketTree(DEFAULT_FILTER)
            return
        }
        if (actionCode === 'apply') {
            setAppliedFilter(draftFilter)
            setTicketTree(draftFilter)
            setIsFilterChange(false)
            setIsShowFilterForm(false)
            return
        }
        handleFilterClick()
    }

    const handleDraftFilterChange = (values: ITicketFilterValues) => {
        setDraftFilter(values)
        setIsFilterChange(true)
    }

    const handleNodeSelect = (
        selectedKeys: Key[],
        info: ISelectedNodeInfo,
        expandedNodeKeys?: Key[]
    ) => {
        console.log('handleNodeSelect called with info:', info, 'selectedKeys:', selectedKeys);
        setDefaultSelectedKeys(selectedKeys)
        setDefaultSelectedNodeInfo(info)
        if (info.node.NodeType?.toLowerCase() === 'prodno' && info.node.ticketRecord) {
            setSelectedTicket(info.node.ticketRecord as ITicketRecord)    //selectedTicket
        } else {
            setSelectedTicket(null)
        }
    }

    const handleNodeExpand = (expandedNodeKeys: Key[]) => {
        setDefaultExpandedKeys(expandedNodeKeys)
    }

    const handleKeywordSearch = (value: string) => {
        if (!treeData.length) return
        const foundedNode = FnSearchKeywordInLocalTree(value, treeData, searchHistory)
        if (foundedNode?.foundNode) {
            const parentKeys = foundedNode.parentNodes?.map((node) => node.key) ?? []
            setDefaultExpandedKeys(parentKeys)
            if (foundedNode.foundNode.NodeType?.toLowerCase() === 'prodno') {
                selectLeaf(foundedNode.foundNode, parentKeys, treeData, 'found-select')
            } else {
                setDefaultSelectedKeys([foundedNode.foundNode.key])
                setDefaultSelectedNodeInfo({
                    event: 'found-select',
                    selected: true,
                    node: foundedNode.foundNode,
                    selectedNodes: [foundedNode.foundNode],
                })
                setSelectedTicket(null)
            }
            setSearchHistory((prev) => [...prev, value])
        }
    }

    const filterDirty = useMemo(
        () =>
            appliedFilter.showAll !== DEFAULT_FILTER.showAll ||
            appliedFilter.byMfg !== DEFAULT_FILTER.byMfg ||
            isFilterChange,
        [appliedFilter, isFilterChange]
    )

    return (
        <div
            key={myRequestsProps.uniqueName}
            className="nz-ticket-explorer-container nz-w-100 nz-h-100"
        >
            <div className='nz-sub-header'>
                <Label
                    uniqueName={`${myRequestsProps.uniqueName}-header`}
                    label={myRequestsProps.headerText}
                    fontWeight='600' />
            </div>

            {loading ? (
                <div className="nz-ticket-explorer-loading-container nz-w-100 nz-h-100">
                    <Label
                        uniqueName={`${myRequestsProps.uniqueName}-loading`}
                        label="Loading tickets..."
                    />
                </div>
            ) : error ? (
                <div className="nz-ticket-explorer-error-container nz-w-100 nz-h-100">
                    <div className="nz-ticket-explorer-error">Error loading tickets: {error}</div>
                </div>
            ) : (
                <Splitter tabIndex={-1} className="nz-w-100 nz-h-100 nz-ticket-explorer-content">
                    <SplitterPanel
                        tabIndex={-1}
                        size={30}
                        minSize={15}
                        className="nz-d-flex-column nz-pane-1"
                    >
                        <div className="nz-dc-explorer-container">
                            {!isShowFilterForm ? (
                                <div className="nz-wh-100 nz-dce-search-tree-container">
                                    <div className="nz-dce-search-container">
                                        <SearchControl
                                            uniqueName={`${myRequestsProps.uniqueName}-search`}
                                            isShowFilterControl={true}
                                            lensDirty={searchText.length > 0}
                                            filterDirty={filterDirty}
                                            searchInputValue={searchText}
                                            hideSearchControl={false}
                                            hideRightMouseMenu={true}
                                            searchValueChange={(value: string) => {
                                                setSearchText(value)
                                                setSearchHistory([])
                                            }}
                                            handleFilterMouse={handleFilterClick}
                                            handleLensMouse={() => {
                                                if (searchText.length > 0) {
                                                    handleKeywordSearch(searchText)
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="nz-dce-tree-container">
                                        {treeData.length > 0 ? (
                                            <TreeControl
                                                uniqueName={`${myRequestsProps.uniqueName}-tree`}
                                                treeData={treeData}
                                                featureId={myRequestsProps.featureId}
                                                autoFocus={true}
                                                defaultExpandedKeys={defaultExpandedKeys}
                                                defaultSelectedKeys={defaultSelectedKeys}
                                                defaultCheckedKeys={[]}
                                                defaultSelectedNodeInfo={
                                                    defaultSelectedNodeInfo || undefined
                                                }
                                                allowCheckbox={false}
                                                allowIcon={true}
                                                allowInternalDrag={false}
                                                allowMultiple={false}
                                                className="nz-dce-tree-for-flat-data"
                                                handleNodeExpand={handleNodeExpand}
                                                handleNodeSelect={handleNodeSelect}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <TicketFilterForm
                                    uniqueName={`${myRequestsProps.uniqueName}-filter`}
                                    headerText="Filter Tickets"
                                    isFilterChange={isFilterChange}
                                    filterValues={draftFilter}
                                    handleFilterChange={handleDraftFilterChange}
                                    handleActionImageClick={handleFilterActionClick}
                                />
                            )}
                        </div>
                    </SplitterPanel>
                    <SplitterPanel
                        tabIndex={-1}
                        size={70}
                        minSize={30}
                        className="nz-d-flex-column nz-pane-2"
                    >
                        <TicketDetailPane
                            uniqueName={`${myRequestsProps.uniqueName}-detail`}
                            ticket={selectedTicket}
                        />
                    </SplitterPanel>
                </Splitter>
            )}
        </div>
    )
}

export default MyRequests
export type { IMyRequestsContainer }
