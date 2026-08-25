
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NodeDragEventParams } from 'rc-tree/lib/contextTypes'
import { EventDataNode, Key } from 'rc-tree/lib/interface'
import Tree, { CheckInfo } from 'rc-tree/lib/Tree'
import '../../allcss/tree/tree.css'
import '../../allcss/tree/TreeControl.css'
import { Cross, Edit24x24, Plus } from '@n20a/libicon'
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { FnGetNodeDetailsBaseOnKey } from '../../allcommon/sidebar/FnGetNodeDetailsBaseOnKey'
import { FnGetAutoExpandNodeKeys } from '../../allcommon/tree/FnGetAutoExpandNodeKeys'
import { FnGetAllKeysOfTree } from '../../allcommon/tree/FnGetAllKeysOfTree'
import { FnFocusRcTree } from '../../allcommon/tree/FnFocusRcTree'
import { ITreeControl } from '../../allinterface/tree/ITreeControl'
import { IImage } from '../../allinterface/basic/IImage'
import { ITreeNode } from '../../allinterface/tree/ITreeControl'
import { ISelectedNodeInfo } from '../../allinterface/tree/ITreeControl'
import { IExpandedNodeInfo } from '../../allinterface/tree/ITreeControl'
import { ActionImage } from '../../basic/actionimage/ActionImage'
import { BaseTree } from './BaseTree'

const TreeControl = (treeControlProps: ITreeControl) => {
  const treeRef = useRef<Tree<ITreeNode>>(null as unknown as Tree<ITreeNode>);
  const [treeData, setTreeData] = useState<ITreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Key[]>([]);
  const [selectedNodeInfo, setselectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
  const [activeKey, setActiveKey] = useState<Key>();
  const [isFocusOnNode, setIsFocusOnNode] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isManualExpanded, setIsManualExpanded] = useState<boolean>(false);
  const [strictlyCheckedKeys, setStrictlyCheckedKeys] = useState<{ checked: Key[]; halfChecked: Key[]; }>();
  const [shouldFocusTree, setShouldFocusTree] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const treeDivRef = useRef<HTMLDivElement>(null);

  // Split large useEffect into focused effects for better performance and clarity

  // Effect 1: Handle tree data updates
  useEffect(() => {
    if (treeControlProps.treeData && treeControlProps.treeData.length > 0) {
      setTreeData(treeControlProps.treeData);
    } else {
      setTreeData([]);
    }
  }, [treeControlProps.treeData]);

  // Effect 2: Handle expanded keys updates
  useEffect(() => {
    if (treeControlProps.defaultExpandedKeys) {
      if (
        treeControlProps.allowDefaultExpandAll &&
        treeControlProps.treeData &&
        treeControlProps.treeData.length > 0 &&
        !isManualExpanded
      ) {
        setExpandedKeys(FnGetAllKeysOfTree(treeControlProps.treeData));
      } else {
        setExpandedKeys(treeControlProps.defaultExpandedKeys);
      }
    }
  }, [
    treeControlProps.defaultExpandedKeys,
    treeControlProps.allowDefaultExpandAll,
    treeControlProps.treeData,
    isManualExpanded
  ]);

  // Effect 3: Handle selected keys updates
  useEffect(() => {
    if (treeControlProps.defaultSelectedKeys) {
      setSelectedKeys(treeControlProps.defaultSelectedKeys);
      setActiveKey(
        treeControlProps.defaultSelectedKeys.length
          ? treeControlProps.defaultSelectedKeys[0]
          : undefined
      );

      if (treeControlProps.defaultSelectedKeys.length && treeControlProps.autoFocus) {
        setShouldFocusTree(true);
      }
    }
  }, [treeControlProps.defaultSelectedKeys, treeControlProps.autoFocus]);

  // Effect 4: Handle selected node info updates
  useEffect(() => {
    if (treeControlProps.defaultSelectedNodeInfo) {
      setselectedNodeInfo(treeControlProps.defaultSelectedNodeInfo);
    }
  }, [treeControlProps.defaultSelectedNodeInfo]);

  // Effect 5: Handle checked keys updates
  useEffect(() => {
    if (treeControlProps.defaultCheckedKeys) {
      setCheckedKeys(treeControlProps.defaultCheckedKeys);
    }
  }, [treeControlProps.defaultCheckedKeys]);

  // Effect 6: Handle strictly checked keys updates
  useEffect(() => {
    if (treeControlProps.defaultStrictlyCheckedKeys) {
      setStrictlyCheckedKeys(treeControlProps.defaultStrictlyCheckedKeys);
    }
  }, [treeControlProps.defaultStrictlyCheckedKeys]);

  // Focus tree when shouldFocusTree flag is set
  useEffect(() => {
    if (shouldFocusTree && treeControlProps.autoFocus) {
      treeNodeKeyBordfocus();
      setShouldFocusTree(false);
    }
  }, [shouldFocusTree, treeControlProps.autoFocus]);

  // Cleanup drag state on unmount to prevent race conditions
  useEffect(() => {
    return () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };
  }, []);

  const treeNodeKeyBordfocus = useCallback(() => {
    if (!treeDivRef.current) return;
    FnFocusRcTree(treeDivRef.current);
    const input = treeDivRef.current.querySelector('.rc-tree input') as HTMLInputElement | null;
    if (input) {
      input.focus();
    }
  }, [])

  useEffect(() => {
    if (isFocusOnNode) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (treeRef.current) {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            // Move focus to the previous node
            e.preventDefault();
            // this can be used in future setFocusOnNode(e.key);
          }
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isFocusOnNode]);

  // Helper function to recursively remove keys from expanded list
  const removeKeysRecursively = useCallback((keysToFilter: Key[], key: Key, nodeData: ITreeNode): Key[] => {
    let filteredKeys = keysToFilter.filter((k: Key) => k !== key);
    if (nodeData && nodeData.children) {
      nodeData.children.forEach((child: ITreeNode) => {
        filteredKeys = removeKeysRecursively(filteredKeys, child.key, child);
      });
    }
    return filteredKeys;
  }, []);

  // Helper to handle single child auto-expansion
  const handleSingleChildExpand = useCallback(async (
    info: IExpandedNodeInfo,
    expandedNodeKeys: Key[]
  ) => {
    const { keysToExpand, nodeToSelect } = await FnGetAutoExpandNodeKeys([info.node]);
    if (keysToExpand?.length) {
      const mergedArray = [...new Set([...keysToExpand, ...expandedNodeKeys])];
      setExpandedKeys(mergedArray);

      if (nodeToSelect) {
        const autoSelectedNode = nodeToSelect as ITreeNode;
        setSelectedKeys([autoSelectedNode.key]);
        const selectedNode: ISelectedNodeInfo = {
          event: "auto-select",
          selected: true,
          node: autoSelectedNode,
          selectedNodes: [autoSelectedNode],
          nativeEvent: info.nativeEvent
        };
        setselectedNodeInfo(selectedNode);
        treeControlProps.handleNodeSelect?.(
          [autoSelectedNode.key],
          selectedNode,
          mergedArray
        );
      }
    }
  }, [treeControlProps]);

  // Helper to handle multiple children expansion
  const handleMultipleChildrenExpand = useCallback((
    info: IExpandedNodeInfo,
    expandedNodeKeys: Key[]
  ) => {
    setExpandedKeys(expandedNodeKeys);
    setSelectedKeys([info.node.children![0].key]);
    const selectedNode: ISelectedNodeInfo = {
      event: "auto-select",
      selected: true,
      node: info.node.children![0],
      selectedNodes: [info.node.children![0]],
      nativeEvent: info.nativeEvent
    };
    setselectedNodeInfo(selectedNode);
    treeControlProps.handleNodeSelect?.(
      [info.node.children![0].key],
      selectedNode,
      expandedNodeKeys
    );
  }, [treeControlProps]);

  // Helper to handle node collapse
  const handleNodeCollapse = useCallback((
    info: IExpandedNodeInfo,
    expandedNodeKeys: Key[]
  ) => {
    const updatedExpandedKeys = removeKeysRecursively(
      expandedNodeKeys,
      info.node.key,
      info.node
    );
    setExpandedKeys(updatedExpandedKeys);
    setSelectedKeys([info.node.key]);
    const selectedNode: ISelectedNodeInfo = {
      event: "auto-select-expand",
      selected: true,
      node: info.node,
      selectedNodes: [info.node],
      nativeEvent: info.nativeEvent
    };
    setselectedNodeInfo(selectedNode);
    treeControlProps.handleNodeSelect?.(
      [info.node.key],
      selectedNode,
      updatedExpandedKeys,
      true
    );
  }, [removeKeysRecursively, treeControlProps]);

  // Placeholder handlers
  const handleNodeClick = useCallback((event: React.MouseEvent, node: ITreeNode) => {
    treeNodeKeyBordfocus();
    treeControlProps.handleNodeClick && treeControlProps.handleNodeClick(event, node);
  }, [treeControlProps, treeNodeKeyBordfocus]);

  // Main node expand handler with extracted logic
  const handleNodeExpand = useCallback(async (
    expandedNodeKeys: Key[],
    info: IExpandedNodeInfo
  ) => {
    if (isDraggingRef.current) return;
    setIsManualExpanded(true);

    if (info.expanded) {
      // Handle node expansion
      const hasChildren = info.node?.children && info.node.children.length > 0;
      const shouldAutoExpand = !treeControlProps.allowAPICallOnExpand && hasChildren;

      if (shouldAutoExpand) {
        if (info.node.children!.length === 1) {
          await handleSingleChildExpand(info, expandedNodeKeys);
        } else {
          handleMultipleChildrenExpand(info, expandedNodeKeys);
        }
      } else {
        setExpandedKeys(expandedNodeKeys);
        treeControlProps.handleNodeExpand?.(expandedNodeKeys, info);
      }
    } else {
      // Handle node collapse
      handleNodeCollapse(info, expandedNodeKeys);
    }
  }, [
    treeControlProps,
    handleSingleChildExpand,
    handleMultipleChildrenExpand,
    handleNodeCollapse
  ]);

  const onDrop = useCallback((info: NodeDragEventParams<ITreeNode> & {
    dragNode: EventDataNode<ITreeNode>;
    dragNodesKeys: Key[];
    dropPosition: number;
    dropToGap: boolean;
  }) => {
    setIsDragging(false);
    isDraggingRef.current = false;
    treeControlProps.onDrop && treeControlProps.onDrop(info);
  }, [treeControlProps]);

  const handleNodeSelect = useCallback((selectedKeys: Key[], info: ISelectedNodeInfo) => {
    if (isDraggingRef.current) return;

    if (treeControlProps.disableSelection)
      return;

    if (info.selected) {
      setSelectedKeys(selectedKeys);
      setselectedNodeInfo(info);
    }
    if (info.event === "select") {
      treeNodeKeyBordfocus()
    }
    setActiveKey(info.node.key);

    treeControlProps.handleNodeSelect && treeControlProps.handleNodeSelect(selectedKeys, info);
  }, [treeControlProps, treeNodeKeyBordfocus]);

  const handleNodeCheck = useCallback((checked: {
    checked: Key[];
    halfChecked: Key[];
  } | Key[], info: CheckInfo<ITreeNode>) => {

    let newChecked = checked;
    if (!treeControlProps.allowCheckStrictly) {
      setCheckedKeys(checked as Key[]);
      newChecked = checked as Key[];
    }
    treeControlProps.handleNodeCheck && treeControlProps.handleNodeCheck(newChecked, info);
  }, [treeControlProps]);

  //why empty handler for right click? because rc-tree requires it to prevent default context menu and allow custom right click handling. If we don't provide this handler, rc-tree won't trigger onRightClick event and the custom context menu won't work.
  const handleRightClick = (info: {
    event: React.MouseEvent;
    node: ITreeNode;
  }) => {
    return;
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // Safe access to tree nodes without relying on internal state
    if (!treeRef.current) return;

    const treeInstance = treeRef.current as any;
    const nodes = treeInstance.state?.flattenNodes;

    if (!nodes || !Array.isArray(nodes)) return;

    const currentIndex = nodes.findIndex(
      (n: any) => n.key === (activeKey ?? selectedKeys[0])
    );

    if (currentIndex === -1) return;

    if (event.key === "ArrowDown" && currentIndex < nodes.length - 1) {
      const nextKey = nodes[currentIndex + 1].key;
      setActiveKey(nextKey);
      treeRef.current?.scrollTo({ key: nextKey }); // keeps it visible
    }

    if (event.key === "ArrowUp" && currentIndex > 0) {
      const prevKey = nodes[currentIndex - 1].key;
      setActiveKey(prevKey);
      treeRef.current?.scrollTo({ key: prevKey });
    }

    const { key } = event;
    if (key === "Enter") {
      if (activeKey) {
        setSelectedKeys([activeKey]);
        let data = FnGetNodeDetailsBaseOnKey(treeData, activeKey, true);
        let info: {
          event: "select" | "auto-select";
          selected: boolean;
          node: ITreeNode;
          selectedNodes: ITreeNode[];
        } | null = null
        if (data.nodeData?.node) {

          info = {
            event: "select",
            selected: true,
            node: data.nodeData?.node,
            selectedNodes: [data.nodeData?.node],
          }
          treeControlProps.handleNodeSelect && treeControlProps.handleNodeSelect([activeKey], info);
        }

      }
    }
  }, [activeKey, selectedKeys, treeData, treeControlProps]);

  const onActiveChange = useCallback((key: Key) => {
    if (key) {
      const activeNode = document?.querySelector(
        ".rc-tree-treenode-active"
      ) as HTMLElement | null;

      if (activeNode) {
        activeNode.scrollIntoView({
          behavior: "smooth", // or "auto"
          block: "center",    // center it in view (can use "nearest" or "start")
          inline: "nearest"
        });
      }
    }
  }, []);

  const handleDragStart = useCallback((info: NodeDragEventParams<ITreeNode>) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    if (treeControlProps.handleDragStart) {
      treeControlProps.handleDragStart(info);
    }
  }, [treeControlProps]);


  // Memoized action image objects to prevent recreation on every render
  const addImage: IImage = useMemo(() => ({
    uniqueName: `${treeControlProps.uniqueName}-iadd`,
    source: <Plus
      size={FnGetCssVariable('--image-size-2')}
      fill='none'
      strokeWidth={1} />,
    type: "svg" as const,
    w: 'var(--image-size-2)',
    tooltip: "Click to Add"
  }), [treeControlProps.uniqueName]);

  const editImage: IImage = useMemo(() => ({
    uniqueName: `${treeControlProps.uniqueName}-iedit`,
    source: <Edit24x24
      size={FnGetCssVariable('--image-size-2')}
      fill='none'
      strokeWidth={1} />,
    w: 'var(--image-size-2)',
    type: "svg" as const,
    tooltip: "Click to Edit"
  }), [treeControlProps.uniqueName]);

  const deleteImage: IImage = useMemo(() => ({
    uniqueName: `${treeControlProps.uniqueName}-idelete`,
    source: <Cross
      size={FnGetCssVariable('--image-size-2')}
      fill='red' />,
    w: 'var(--image-size-2)',
    type: "svg" as const,
    tooltip: "Click to Delete"
  }), [treeControlProps.uniqueName]);

  useEffect(() => {
    if (!selectedNodeInfo || !treeDivRef.current) return;

    const raf = requestAnimationFrame(() => {
      const container = treeDivRef.current;
      if (!container) return;

      const nodeEl = container.querySelector(
        ".rc-tree-node-selected"
      ) as HTMLElement | null;

      const containerEl = container.querySelector(
        ".rc-tree-list-holder-inner"
      ) as HTMLElement | null;

      if (!nodeEl || !containerEl) return;

      const nodeRect = nodeEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      const isAbove = nodeRect.top < containerRect.top;
      const isBelow = nodeRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        nodeEl.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [selectedNodeInfo]);

  const handleNodeDoubleClick = useCallback((
    e: React.MouseEvent<HTMLSpanElement>,
    node: EventDataNode<ITreeNode>
  ) => {
    e.stopPropagation();
    if (treeControlProps.handleNodeDoubleClick) {
      treeControlProps.handleNodeDoubleClick(e, node);
    }
  }, [treeControlProps]);

  const handleExternalDrop = useCallback((event: React.DragEvent<HTMLSpanElement>, targetNode: ITreeNode): void => {
    treeControlProps.handleExternalDrop?.(event, targetNode);
  }, [treeControlProps]);

  const canAcceptExternalDrop = useCallback((targetNode: ITreeNode): boolean => {
    if (treeControlProps.canAcceptExternalDrop) {
      return treeControlProps.canAcceptExternalDrop(targetNode);
    }
    else {
      return false;
    }
  }, [treeControlProps]);

  const handleDragEnd = useCallback((info: NodeDragEventParams<ITreeNode>): void => {
    setIsDragging(false);
    isDraggingRef.current = false;
    treeControlProps.handleDragEnd?.(info);
  }, [treeControlProps]);

  const canAllowDragDrop = useCallback((sourceNode: ITreeNode): boolean => {
    if (treeControlProps.canAllowDragDrop) {
      return treeControlProps.canAllowDragDrop(sourceNode);
    }
    else {
      return treeControlProps.allowInternalDrag ? true : false;
    }
  }, [treeControlProps]);

  return (
    <div
      key={treeControlProps.uniqueName}
      ref={treeDivRef}
      className={`nz-tree-action-control-container${treeControlProps.allowDelete || treeControlProps.allowAdd || treeControlProps.allowEdit ? " nz-tree-with-buttons" : ""}`}
      onMouseDown={() => {
        // Include empty-space clicks so only this tree stays focused in dual-tree layouts.
        treeNodeKeyBordfocus();
      }}
    >
      <div className='nz-tree-control-container'>
        <BaseTree
          treeId={treeControlProps.uniqueName}
          className={treeControlProps.className || ""}
          allowCheckbox={treeControlProps.allowCheckbox || false}
          treeData={treeData}
          activeKey={activeKey ?? null}
          selectable={!isDragging}
          allowMultiple={treeControlProps.allowMultiple || false}
          allowIcon={treeControlProps.allowIcon || false}
          allowDefaultExpandAll={treeControlProps.allowDefaultExpandAll || false}
          allowInternalDrag={treeControlProps.allowInternalDrag || false}
          expandedKeys={expandedKeys}
          allowCheckStrictly={treeControlProps.allowCheckStrictly || false}
          strictlyCheckedKeys={strictlyCheckedKeys}
          checkedKeys={checkedKeys}
          selectedKeys={treeControlProps.disableSelection ? [] : selectedKeys}
          treeRef={treeRef}
          handleNodeClick={handleNodeClick}
          handleNodeExpand={handleNodeExpand}
          onDrop={onDrop}
          handleNodeSelect={handleNodeSelect}
          handleNodeCheck={handleNodeCheck}
          handleRightClick={handleRightClick}
          handleKeyDown={handleKeyDown}
          onActiveChange={onActiveChange}
          handleDragStart={handleDragStart}
          handleNodeDoubleClick={handleNodeDoubleClick}
          handleExternalDrop={handleExternalDrop}
          canAcceptExternalDrop={canAcceptExternalDrop}
          canAllowDragDrop={canAllowDragDrop}
          handleDragEnd={handleDragEnd}
        />
      </div>
      {(treeControlProps.allowAdd || treeControlProps.allowDelete || treeControlProps.allowEdit) &&
        <div className='nz-action-panel'>
          {treeControlProps.allowAdd && treeControlProps.handleAIClick &&
            <ActionImage image={addImage} w={'var(--node_height)'} h={'var(--node_height)'}
              uniqueName={`${treeControlProps.uniqueName}-aiadd`}
              actionCode={'add'}
              disabled={treeControlProps.disableAdd || false}
              handleMouse={treeControlProps.handleAIClick} />
          }
          {treeControlProps.allowEdit && treeControlProps.handleAIClick &&
            <ActionImage image={editImage} w={'var(--node_height)'} h={'var(--node_height)'}
              uniqueName={`${treeControlProps.uniqueName}-aiedit`}
              disabled={(selectedNodeInfo && selectedNodeInfo.node && selectedNodeInfo.node.IsNZ) || treeControlProps.disableEdit || false}
              actionCode={'edit'}
              handleMouse={treeControlProps.handleAIClick} />
          }
          {treeControlProps.allowDelete && treeControlProps.handleAIClick &&
            <ActionImage image={deleteImage} w={'var(--node_height)'} h={'var(--node_height)'}
              uniqueName={`${treeControlProps.uniqueName}-aidelete`}
              actionCode={'delete'}
              disabled={(selectedNodeInfo && selectedNodeInfo.node && selectedNodeInfo.node.IsNZ) || treeControlProps.disableDelete || false}
              handleMouse={treeControlProps.handleAIClick} />
          }
          {Array.isArray(treeControlProps.customIcons) && treeControlProps.handleAIClick &&
            treeControlProps.customIcons.map((icon, index) => (
              <ActionImage
                key={index}
                image={icon.image || deleteImage} // fallback image if not provided
                w={icon.w || 'var(--node_height)'}
                h={icon.h || 'var(--node_height)'}
                uniqueName={`${treeControlProps.uniqueName}-${icon.actionCode || 'custom'}-${index}`}
                actionCode={icon.actionCode || 'custom'}
                disabled={icon.disabled || false}
                handleMouse={treeControlProps.handleAIClick!}
              />
            ))
          }
        </div>
      }
    </div>
  )
}
export { TreeControl }
