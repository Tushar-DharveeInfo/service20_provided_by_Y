
import { useRef, useCallback, useEffect } from "react";
import Tree, { TreeNodeProps } from "rc-tree";
import { CaretRight24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { IBaseTree } from '../../allinterface/tree/IBaseTree';
import { Image } from "../../basic/image/Image";
import { ITreeNode } from "../../allinterface/tree/ITreeControl";

const BaseTree = (baseTreeProps: IBaseTree) => {
    const isDraggingRef = useRef(false);
    const isDragDropMatchRef = useRef(false);
    const dragHoverKeyRef = useRef<string | null>(null)

    // Cleanup drag state on unmount to prevent race conditions
    useEffect(() => {
        return () => {
            isDraggingRef.current = false;
            isDragDropMatchRef.current = false;
            dragHoverKeyRef.current = null;
        };
    }, []);

    const switcher = useCallback((obj: TreeNodeProps) => {
        if (obj.isLeaf) {
            return;
        }
        return (
            <div key={`${obj.eventKey}-caret-div`} className={obj.expanded
                ? `rc-cst-tree-node-expanded ${obj.className}`
                : "rc-cst-tree-node"}
                onMouseDown={(e) => {
                    e.preventDefault();
                }} style={{ cursor: 'pointer' }}>
                <Image
                    uniqueName={`${obj.eventKey}-caret`}
                    source={<CaretRight24x24
                        size={FnGetCssVariable('--node_height')}
                        fill='none'
                        strokeWidth={1} />}
                    w={"var(--node_height)"}
                />
            </div>
        );
    }, []);

    // Helper to reset drag state
    const resetDragState = useCallback(() => {
        dragHoverKeyRef.current = null;
        isDragDropMatchRef.current = false;
    }, []);

    // Helper to set drag state
    const setDragState = useCallback((key: string) => {
        isDragDropMatchRef.current = true;
        dragHoverKeyRef.current = key;
    }, []);

    // Handle external drag over
    const handleExternalDragOver = useCallback((event: React.DragEvent, canDropHere: boolean) => {
        const sourceTree = event.dataTransfer?.getData("sourceTree");
        const isExternalDrag = sourceTree !== baseTreeProps.treeId;

        if (!isExternalDrag) return; // Internal drag handled by rc-tree

        if (!event.dataTransfer) return;

        event.dataTransfer.dropEffect = canDropHere ? "move" : "none";

        if (canDropHere) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, [baseTreeProps.treeId]);

    // Handle internal drag over
    const handleInternalDragOver = useCallback(({ event, node }: { event: React.DragEvent, node: any }) => {
        event.preventDefault();

        const target = event.target as HTMLElement;
        const treeNodeEl = target.closest('.rc-tree-treenode.drop-target') as HTMLElement;

        if (!treeNodeEl) {
            resetDragState();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "none";
            }
            return;
        }

        setDragState(node.key as string);
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
        }
    }, [resetDragState, setDragState]);

    // Render title with external drag/drop support
    const renderTitle = useCallback((node: any) => {
        const treeNode = node as ITreeNode;
        const canDropHere = baseTreeProps.canAcceptExternalDrop(treeNode);

        return (
            <span
                style={{
                    display: "inline-block",
                    width: "100%",
                    padding: "2px 0",
                }}
                onDragOver={isDraggingRef.current ? undefined : (event) => handleExternalDragOver(event, canDropHere)}
                onDrop={(event) => {
                    const sourceTree = event.dataTransfer?.getData("sourceTree");

                    // ONLY external
                    if (sourceTree !== baseTreeProps.treeId) {
                        if (!canDropHere) return;

                        event.preventDefault();
                        event.stopPropagation();

                        baseTreeProps.handleExternalDrop?.(event, treeNode);
                    }

                    // internal handled by rc-tree
                }}
            >
                {treeNode.title}
            </span>
        );
    }, [baseTreeProps, handleExternalDragOver]);

    return (
        <div
            style={{
                height: "100%",
                overflow: "auto",
                // paddingBottom: "var(--tree-scroll-padding, 40px)"
            }}
        >
            <Tree
                tabIndex={1}
                className={
                    baseTreeProps.className ? baseTreeProps.className : "ng-treeview-setting nz-setting-tree"
                }
                onClick={baseTreeProps.handleNodeClick}
                onDoubleClick={baseTreeProps.handleNodeDoubleClick}
                onExpand={baseTreeProps.handleNodeExpand}
                showLine={true}
                checkable={baseTreeProps.allowCheckbox}
                treeData={baseTreeProps.treeData}
                ref={baseTreeProps.treeRef}
                multiple={baseTreeProps.allowMultiple}
                selectable={baseTreeProps.selectable}
                showIcon={baseTreeProps.allowIcon}
                defaultExpandAll={baseTreeProps.allowDefaultExpandAll}
                draggable={{
                    icon: false,
                    nodeDraggable: (node) =>
                        baseTreeProps.canAllowDragDrop(node as ITreeNode),
                }}
                onDrop={baseTreeProps.onDrop}
                titleRender={renderTitle}
                switcherIcon={switcher}
                dropIndicatorRender={(props) => {
                    const { dropPosition } = props;
                    const finalPosition = dropPosition < 0 ? -1 : 1;
                    if (!isDragDropMatchRef.current) {
                        return (<></>)
                    }
                    return (
                        <div
                            style={{
                                height: 1,
                                backgroundColor: "var(--drop-indicator-color, #115c31)",
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: finalPosition < 0 ? 0 : undefined,
                                bottom: finalPosition > 0 ? 0 : undefined,
                            }}
                        />
                    );
                }}
                itemHeight={24}
                virtual={false}
                activeKey={isDraggingRef.current ? dragHoverKeyRef.current : baseTreeProps.activeKey}
                expandedKeys={baseTreeProps.expandedKeys}
                checkStrictly={baseTreeProps.allowCheckStrictly}
                onSelect={baseTreeProps.handleNodeSelect}
                onCheck={baseTreeProps.handleNodeCheck}
                checkedKeys={baseTreeProps.allowCheckStrictly ? baseTreeProps.strictlyCheckedKeys : baseTreeProps.checkedKeys}
                selectedKeys={baseTreeProps.selectedKeys}
                onRightClick={baseTreeProps.handleRightClick}
                onKeyDown={baseTreeProps.handleKeyDown}
                onActiveChange={
                    isDraggingRef.current ? undefined : baseTreeProps.onActiveChange
                }
                onDragStart={(info) => {
                    isDraggingRef.current = true;
                    baseTreeProps.handleDragStart?.(info);
                }}
                onDragOver={handleInternalDragOver}
                onDragEnd={(info) => {
                    isDraggingRef.current = false;
                    isDragDropMatchRef.current = false;
                    dragHoverKeyRef.current = null;
                    baseTreeProps.handleDragEnd?.(info);
                }}

                onBlur={(e) => {
                    e.preventDefault();
                }}
            ></Tree>
        </div>
    )
}
export { BaseTree }
