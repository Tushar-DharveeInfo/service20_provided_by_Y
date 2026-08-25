


import React, { useCallback, useEffect, useRef, useState } from 'react'
import { CheckInfo } from 'rc-tree/lib/Tree';
import { EventDataNode, Key } from 'rc-tree/lib/interface';
import { NodeDragEventParams } from 'rc-tree/lib/contextTypes';
import '../../allcss/tree/TreeForHierarchicalDataContainer.css'
import { FnUpdateTreeNodeBasedOnKeyForHierarchicalData } from '../../allcommon/tree/FnUpdateTreeNodeBasedOnKeyForHierarchicalData';
import { FnConvertHierarchicalDataToTree } from '../../allcommon/tree/FnConvertHierarchicalDataToTree';
import { FnAutoExpandTreeNodesHierarchy } from '../../allcommon/tree/FnAutoExpandTreeNodesHierarchy';
import { FnFindParentNode } from '../../allcommon/tree/FnFindParentNode';
import { ISelectedNodeInfo, IExpandedNodeInfo, ITreeNode } from '../../allinterface/tree/ITreeControl';
import { IConvertedTreeResponse, IStrictCheckedKeys, ITreeForHierarchicalDataContainer, TNodeCheckState } from '../../allinterface/tree/ITreeForHierarchicalDataContainer';
import { IActionImageForSubMenu } from '../../allinterface/basic/IActionImageList';
import { TreeControl } from '../treecontrol/TreeControl';

function isStrictCheckedKeys(checked: TNodeCheckState): checked is IStrictCheckedKeys {
    return !Array.isArray(checked);
}

const TreeForHierarchicalDataContainer = (treeContainerHierarchicalDataProps: ITreeForHierarchicalDataContainer) => {
    const [treeData, setTreeData] = useState<ITreeNode[]>([]);
    const [defaultExpandedKeys, setDefaultExpandedKeys] = useState<Key[]>([]);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState<Key[]>([]);
    const [defaultCheckedKeys, setDefaultCheckedKeys] = useState<Key[]>([]);
    const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null)
    const [defaultStrictlyCheckedKeys, setDefaultStrictlyCheckedKeys] = useState<{
        checked: Key[];
        halfChecked: Key[];
    }>();
    const needToUpdateTreeNodeRef = useRef<boolean>(false);
    const treeDataRef = useRef(treeData);
    // Tracks the last processed selection key signature to avoid redundant tree updates.
    const lastHandledKeysRef = useRef<string>("");

    // Clears cached tree data when the container unmounts.
    useEffect(() => {
        return () => {
            treeDataRef.current = [];
        }
    }, [])

    // Builds tree state from API data or applies pre-generated tree props.
    useEffect(() => {
        if (treeContainerHierarchicalDataProps.allowGenerateTreeData) {
            const apiData = treeContainerHierarchicalDataProps.apiData;
            if (!apiData || Array.isArray(apiData)) {
                setTreeData([]);
                return;
            }
            FnConvertHierarchicalDataToTree(apiData, treeContainerHierarchicalDataProps).then((result: IConvertedTreeResponse | undefined) => {
                if (result) {

                    treeContainerHierarchicalDataProps.handleGeneratedTreedata && treeContainerHierarchicalDataProps.handleGeneratedTreedata(result.treeData, treeContainerHierarchicalDataProps.uniqueName);
                    setTreeData(result.treeData);
                    treeDataRef.current = result.treeData;
                    if (treeContainerHierarchicalDataProps.featureTreeProps.openAllNodes) {
                        setDefaultExpandedKeys([]);
                    } else {
                        setDefaultExpandedKeys(result.expandedKeys);
                    }
                    if (result.selectedKey)
                        setDefaultSelectedKeys([result.selectedKey]);
                    result.selectedNode && setDefaultSelectedNodeInfo({
                        event: 'select',
                        selected: true,
                        node: result.selectedNode,
                        selectedNodes: [result.selectedNode]
                    });
                }
                else {
                    setTreeData([])
                }
            }).catch((error: unknown) => {
                console.error("Failed to convert hierarchical data to tree:", error);
                setTreeData([]);
            })
        }
        else {
            const apiData = treeContainerHierarchicalDataProps.apiData;
            if (Array.isArray(apiData)) {
                setTreeData(apiData);
                treeDataRef.current = apiData;
            }
            setDefaultExpandedKeys(treeContainerHierarchicalDataProps.defaultExpandedKeys || []);
            setDefaultSelectedKeys(treeContainerHierarchicalDataProps.defaultSelectedKeys || []);
            if (treeContainerHierarchicalDataProps.featureTreeProps.allowCheckStrictly) {
                setDefaultStrictlyCheckedKeys(treeContainerHierarchicalDataProps.defaultStrictlyCheckedKeys)
            }
            else {
                setDefaultCheckedKeys(treeContainerHierarchicalDataProps.defaultCheckedKeys || []);
            }
            setDefaultSelectedNodeInfo(treeContainerHierarchicalDataProps.defaultSelectedNodeInfo || null);
        }
    }, [treeContainerHierarchicalDataProps, treeContainerHierarchicalDataProps.apiData, treeContainerHierarchicalDataProps.defaultExpandedKeys])


    // Marks the tree for refresh when the context-menu refresh action is selected.
    const handleKebabMenuSelect = useCallback((selectedItem: IActionImageForSubMenu) => {
        // if (selectedItem.payload?.Label?.toLowerCase() === RightMouseMenuTreeNode.Refresh.toLowerCase()) {
        //     needToUpdateTreeNodeRef.current = true;
        // }
        treeContainerHierarchicalDataProps.handleKebabMenuSelect && treeContainerHierarchicalDataProps.handleKebabMenuSelect(selectedItem);
    }, [treeContainerHierarchicalDataProps]);

    // Updates copy/kebab icons on the selected node when selection changes.
    const handleSelectedKeyChange = useCallback(async (currentTreeData: ITreeNode[]) => {
        const updatedTreeData = await FnUpdateTreeNodeBasedOnKeyForHierarchicalData(
            currentTreeData, // Pass dynamic treeData explicitly
            defaultSelectedKeys[0],
            treeContainerHierarchicalDataProps.featureTreeProps.hideCopyIcon === false,
            treeContainerHierarchicalDataProps.featureTreeProps.hideKebabMenu === false,
            treeContainerHierarchicalDataProps,
            treeContainerHierarchicalDataProps.selectedNodeExplorer,
            handleKebabMenuSelect
        );
        // Only update if data has changed to prevent infinite loops
        treeDataRef.current = updatedTreeData;
        setTreeData([...updatedTreeData]);

    }, [defaultSelectedKeys, treeContainerHierarchicalDataProps, handleKebabMenuSelect]);


    // Re-renders node chrome when selected keys change and copy/kebab icons are enabled.
    useEffect(() => {
        if (
            !defaultSelectedKeys?.length ||
            (treeContainerHierarchicalDataProps.featureTreeProps.hideCopyIcon &&
                treeContainerHierarchicalDataProps.featureTreeProps.hideKebabMenu)
        ) {
            return;
        }
        const keySignature = defaultSelectedKeys.join("|");
        if (lastHandledKeysRef.current === keySignature && needToUpdateTreeNodeRef.current === false) {
            return; //  already handled
        }

        lastHandledKeysRef.current = keySignature;
        handleSelectedKeyChange(treeDataRef.current);

    }, [
        defaultSelectedKeys,
        handleSelectedKeyChange,
        treeContainerHierarchicalDataProps.featureTreeProps.hideCopyIcon,
        treeContainerHierarchicalDataProps.featureTreeProps.hideKebabMenu
    ]);


    // Propagates checkbox changes and applies strict parent/child check rules when enabled.
    function handleNodeCheck(checked: TNodeCheckState, info: CheckInfo<ITreeNode>): void {
        let newChecked: TNodeCheckState = checked;
        if (treeContainerHierarchicalDataProps.featureTreeProps.allowCheckStrictly && !treeContainerHierarchicalDataProps.featureTreeProps.allowCustomCheck) {
            if (!isStrictCheckedKeys(checked)) {
                treeContainerHierarchicalDataProps.handleNodeCheck?.(checked, info);
                return;
            }
            const defaultCheck = checked;

            // Collects descendant keys and nodes for strict checkbox propagation.
            const getAllChildNodesAndKeys = (
                node: ITreeNode
            ): { keys: Key[]; nodes: ITreeNode[] } => {

                const keys: Key[] = [];
                const nodes: ITreeNode[] = [];

                if (node.children) {
                    node.children.forEach((child) => {
                        keys.push(child.key);
                        nodes.push(child);

                        const childData = getAllChildNodesAndKeys(child);

                        keys.push(...childData.keys);
                        nodes.push(...childData.nodes);
                    });
                }

                return { keys, nodes };
            };

            if (info.checked) {
                const childCheckedKeys = getAllChildNodesAndKeys(info.node);
                const baseMergedArray = [...new Set([...defaultCheck.checked, ...childCheckedKeys.keys])];
                const parentNode = FnFindParentNode(treeData, info.node.key);

                if (parentNode) {
                    const isHalfChecked = parentNode.children.some((nodeItem) => !baseMergedArray.includes(nodeItem.key));
                    const halfChecked = isHalfChecked
                        ? [...new Set([...defaultCheck.halfChecked, parentNode.key])]
                        : defaultCheck.halfChecked.filter(key => key !== parentNode.key);
                    const mergedArray = isHalfChecked
                        ? baseMergedArray
                        : [...baseMergedArray, parentNode.key];
                    newChecked = { checked: mergedArray, halfChecked };
                }
                else {
                    info.checkedNodes = childCheckedKeys.nodes;
                    newChecked = {
                        checked: baseMergedArray,
                        halfChecked: defaultCheck.halfChecked,
                    };
                }
                setDefaultStrictlyCheckedKeys(newChecked)
            }
            else {
                const childKeysToRemove = getAllChildNodesAndKeys(info.node);
                const baseRemovedCheckKeys = defaultCheck.checked.filter(key => !childKeysToRemove.keys.includes(key));
                const parentNode = FnFindParentNode(treeData, info.node.key);

                if (parentNode) {
                    const isHalfChecked = parentNode.children.some((nodeItem) => baseRemovedCheckKeys.includes(nodeItem.key));
                    const removedCheckKeys = baseRemovedCheckKeys.filter(key => key !== parentNode.key);
                    const halfChecked = isHalfChecked
                        ? [...new Set([...defaultCheck.halfChecked, parentNode.key])]
                        : defaultCheck.halfChecked.filter(key => key !== parentNode.key);
                    newChecked = { checked: removedCheckKeys, halfChecked };
                }
                else {
                    info.checkedNodes = [];
                    newChecked = {
                        checked: baseRemovedCheckKeys,
                        halfChecked: defaultCheck.halfChecked,
                    };
                }
                setDefaultStrictlyCheckedKeys(newChecked)
            }
        }
        else if (!treeContainerHierarchicalDataProps.featureTreeProps.allowCustomCheck && Array.isArray(checked)) {
            setDefaultCheckedKeys(checked);
        }
        treeContainerHierarchicalDataProps.handleNodeCheck?.(newChecked, info);
    }

    // Forwards node clicks and blocks drag on unsupported audit-session node types.
    function handleNodeClick(event: React.MouseEvent<Element, MouseEvent>, node: ITreeNode): void {
        treeContainerHierarchicalDataProps.handleNodeClick?.(event, node);


    }

    // Expands nodes via callback or auto-expands hierarchy when no custom handler is provided.
    async function handleNodeExpand(expandedNodeKeys: Key[], info: IExpandedNodeInfo) {
        if (info && info.node) {

            if (treeContainerHierarchicalDataProps.featureTreeProps.instanceName === "model_by_type_treeview"
                && info.node.treetype?.toLowerCase() === "dataset" && info.node.children.length === 0
                && treeContainerHierarchicalDataProps.handleNodeExpand
            ) {
                treeContainerHierarchicalDataProps.handleNodeExpand(expandedNodeKeys, info);
            } else if (treeContainerHierarchicalDataProps.handleNodeExpand) {
                treeContainerHierarchicalDataProps.handleNodeExpand(expandedNodeKeys, info);
            }
            else {
                const autoExpandDetails = FnAutoExpandTreeNodesHierarchy([info.node]);
                setDefaultExpandedKeys(Array.from(new Set([...defaultExpandedKeys, ...autoExpandDetails.expandedKeys])));
                if (autoExpandDetails.selectedKey !== "") {
                    setDefaultSelectedKeys([autoExpandDetails.selectedKey]);
                    autoExpandDetails.selectedNode && setDefaultSelectedNodeInfo({
                        event: 'auto-select',
                        selected: true,
                        node: autoExpandDetails.selectedNode,
                        selectedNodes: [autoExpandDetails.selectedNode]
                    });
                }
                autoExpandDetails.selectedNode && treeContainerHierarchicalDataProps.handleNodeSelect && treeContainerHierarchicalDataProps.handleNodeSelect([autoExpandDetails.selectedKey], {
                    event: 'auto-select',
                    selected: false,
                    node: autoExpandDetails.selectedNode,
                    selectedNodes: [autoExpandDetails.selectedNode],
                    nativeEvent: info.nativeEvent
                }, expandedNodeKeys)
            }


        }
    }

    // Syncs local selection state and forwards the select event to the parent handler.
    async function handleNodeSelect(selectedKeys: Key[], info: ISelectedNodeInfo, expandedNodeKeys?: Key[]) {
        if (info.node.key === defaultSelectedNodeInfo?.node.key) {
            treeContainerHierarchicalDataProps.handleNodeSelect && treeContainerHierarchicalDataProps.handleNodeSelect([info.node.key], info, expandedNodeKeys || defaultExpandedKeys);
            return;
        }
        if (expandedNodeKeys) {
            setDefaultExpandedKeys(expandedNodeKeys);
        }
        setDefaultSelectedKeys([info.node.key]);
        setDefaultSelectedNodeInfo(info)
        treeContainerHierarchicalDataProps.handleNodeSelect && treeContainerHierarchicalDataProps.handleNodeSelect(selectedKeys, info, expandedNodeKeys || defaultExpandedKeys);
    }


    // Delegates internal tree drag-and-drop to the parent when a handler is provided.
    const handleOnDropEvent = (info: NodeDragEventParams<ITreeNode> & {
        dragNode: EventDataNode<ITreeNode>;
        dragNodesKeys: Key[];
        dropPosition: number;
        dropToGap: boolean;
    }) => {
        if (treeContainerHierarchicalDataProps.onDrop) {
            treeContainerHierarchicalDataProps.onDrop(info);
        }
        else {
            //handle drop event for internal drag
        }
    }
    // Delegates drag-start events to the parent when a handler is provided.
    const handleDragStart = (info: NodeDragEventParams<ITreeNode>) => {
        if (treeContainerHierarchicalDataProps.handleDragStart) {
            treeContainerHierarchicalDataProps.handleDragStart(info);
        }
    }
    return (
        <div className='nz-tree-container-hierarchical-data'>
            {treeData && treeData.length > 0 &&
                <TreeControl
                    uniqueName={treeContainerHierarchicalDataProps.uniqueName}
                    treeData={treeData}
                    autoFocus={treeContainerHierarchicalDataProps.autoFocus}
                    defaultExpandedKeys={defaultExpandedKeys}
                    defaultSelectedKeys={defaultSelectedKeys}
                    defaultCheckedKeys={defaultCheckedKeys}
                    defaultSelectedNodeInfo={defaultSelectedNodeInfo || undefined}
                    allowAPICallOnExpand={treeContainerHierarchicalDataProps.allowAPICallOnExpand}
                    allowAdd={treeContainerHierarchicalDataProps.allowAdd}
                    allowEdit={treeContainerHierarchicalDataProps.allowEdit}
                    allowDelete={treeContainerHierarchicalDataProps.allowDelete}
                    disableAdd={treeContainerHierarchicalDataProps.disableAdd}
                    disableEdit={treeContainerHierarchicalDataProps.disableEdit}
                    disableDelete={treeContainerHierarchicalDataProps.disableDelete}
                    allowCheckStrictly={treeContainerHierarchicalDataProps.featureTreeProps.allowCheckStrictly}
                    allowCheckbox={treeContainerHierarchicalDataProps.featureTreeProps.allowCheckbox}
                    allowDefaultExpandAll={treeContainerHierarchicalDataProps.featureTreeProps.openAllNodes}
                    allowIcon={treeContainerHierarchicalDataProps.featureTreeProps.allowIcon}
                    allowInternalDrag={treeContainerHierarchicalDataProps.featureTreeProps.allowInternalDrag}
                    allowMultiple={treeContainerHierarchicalDataProps.allowMultiple}
                    className={treeContainerHierarchicalDataProps.className}
                    defaultStrictlyCheckedKeys={defaultStrictlyCheckedKeys}
                    disableSelection={treeContainerHierarchicalDataProps.featureTreeProps.disableSelection}
                    handleAIClick={treeContainerHierarchicalDataProps.handleAIClick}
                    handleNodeCheck={handleNodeCheck}
                    handleNodeClick={handleNodeClick}
                    handleNodeExpand={handleNodeExpand}
                    handleNodeSelect={handleNodeSelect}
                    onDrop={handleOnDropEvent}
                    handleDragStart={handleDragStart}
                    customIcons={treeContainerHierarchicalDataProps.customIcons}
                    handleExternalDrop={treeContainerHierarchicalDataProps.handleExternalDrop}
                    handleDragEnd={treeContainerHierarchicalDataProps.handleDragEnd}
                    canAcceptExternalDrop={treeContainerHierarchicalDataProps.canAcceptExternalDrop}
                    canAllowDragDrop={treeContainerHierarchicalDataProps.canAllowDragDrop}
                />
            }
        </div>
    )
}
export { TreeForHierarchicalDataContainer }