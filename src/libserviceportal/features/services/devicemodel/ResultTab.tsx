
import React from 'react';
import { Key } from "rc-tree/lib/interface";
import { IExpandedNodeInfo, ISelectedNodeInfo, ITreeNode } from "../../../shared/allinterface/tree/ITreeControl";
import { NodeDragEventParams } from "rc-tree/lib/contextTypes";
import { TreeForHierarchicalDataContainer } from "../../../shared/tree/treeforhierarchicaldatacontainer/TreeForHierarchicalDataContainer";

interface IResultTab {
  uniqueName: string;
  treeData: any; // Hierarchical tree data
  treeProps: any; // tree data props
  defaultExpandedKeys?: Key[]; // Array of keys for expanded nodes
  defaultSelectedKeys?: Key[]; // Array of keys for selected node
  handleNodeSelect?: (selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => void;
  handleNodeExpand?: (expandedNodeKeys: Key[], info: IExpandedNodeInfo) => void;
  handleNodeClick?: (event: React.MouseEvent, node: ITreeNode, treeData: ITreeNode[]) => void; // it will be used to handle drag and drop event manually 
  handleDragStart?: (info: NodeDragEventParams<ITreeNode>) => void;
  handleDragEnd?: (info: NodeDragEventParams<ITreeNode>) => void;
  canAllowDragDrop?: (sourceNode: ITreeNode) => boolean;
}

const ResultTab = (props: IResultTab) => {
  return (
    <>
      {props.treeData && (
        <TreeForHierarchicalDataContainer
          {...props.treeProps}
          apiData={props.treeData}
          allowMultiple={true}
          allowGenerateTreeData={false}
          allowAPICallOnExpand={true}
          defaultExpandedKeys={props.defaultExpandedKeys}
          defaultSelectedKeys={props.defaultSelectedKeys}
          defaultSelectedNodeInfo={undefined}
          handleNodeSelect={props.handleNodeSelect} // Node select callback   
          handleNodeExpand={props.handleNodeExpand}
          handleNodeClick={(event, node) => { props.handleNodeClick && props.handleNodeClick(event, node, props.treeData) }}
          handleDragEnd={props.handleDragEnd}
          handleDragStart={props.handleDragStart}
          canAllowDragDrop={props.canAllowDragDrop}
        />
      )}

    </>
  )
}
export { ResultTab };
export type { IResultTab };