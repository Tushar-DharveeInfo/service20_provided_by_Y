
import { Fragment, MouseEvent } from 'react'
import { Cart24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { FnGetLeafStatusIconConfig } from '../../allcommon/tree/FnGetLeafStatusIconConfig';
import { getfeaturesData } from '../../context/contextandprovider/MainApp';
import { IActionImageForSubMenu } from '../../allinterface/basic/IActionImageList';
import { IMenuItem } from '../../allinterface/menu/IMainMenu';
import { ITreeNode, ISelectedNodeInfo } from '../../allinterface/tree/ITreeControl';
import { IFeatureTree } from '../../allinterface/tree/ITreeForHierarchicalDataContainer';
import { Image } from '../../basic/image/Image';
import { NodeMenu } from '../../menu/nodemenu/NodeMenu';

const TreeNodeTitle = (treeNode: ITreeNode, treeDataProps: IFeatureTree, featureId: string, showKebabIcon?: boolean, showCopyIcon?: boolean, selectedNodeExplorer?: ISelectedNodeInfo, handleKebabMenuSelect?: (selectedItem: IActionImageForSubMenu) => void) => {
    console.log('treeNode TreeNodeTitle', treeNode)
    const featureData = getfeaturesData() as IMenuItem[] ?? null
    const clonedNode = { ...treeNode, title: "", icon: null, children: [] };
    const nodeTooltip = `${treeNode.Description ?? ""}${treeNode.WOID ? ` (${treeNode.WOID})` : ""}`
    const titleContent = `${treeNode.Name} ${treeNode.Desc250 ? ` (${treeNode.Desc250.trim()})` : ""}` || "";

    const renderNodeName = () => {
        return (
            <Fragment key={`node-title-content-${treeNode.key}`}>
                {treeNode.TableLabel || titleContent}
                {treeNode.RecordCount >= 0 ? ` (${treeNode.RecordCount})` : ""}
                {treeNode.HwEntityName ? ` (${treeNode.HwEntityName})` : ""}
            </Fragment>
        );
    };

    const container = treeDataProps.instanceName ?? "explorer_tree"

    const handleDownloadClick = (event: MouseEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
        treeDataProps.onAddToDownloadCart?.(treeNode);
    };

    const renderIcon = () => {
        const newTreeNode = { ...treeNode };
        const showDownloadIcon =
            treeNode.treetype?.toLowerCase() === "product" &&
            !!treeDataProps.onAddToDownloadCart;
        const statusIconConfig = treeDataProps.showLeafStatusIcon
            ? FnGetLeafStatusIconConfig(treeNode)
            : null;
        const StatusIcon = statusIconConfig?.Icon;

        return (
            <span className="nz-tree-node-icons-wrapper" key={`node-icons-${treeNode.key}`}>

                {(showCopyIcon || showKebabIcon) && (
                    <span key={`node-icons-kebabmenu-${treeNode.key}`} className="nz-tree-node-nz-icon-div nz-node-kebab-copy-icon">
                        {showKebabIcon && handleKebabMenuSelect && (
                            <NodeMenu
                                showIcon={true}
                                uniqueName={`kebab-${treeNode.key}`}
                                handleSelect={handleKebabMenuSelect}
                                featureId={featureId}
                                selectedNode={selectedNodeExplorer?.node || newTreeNode}
                                container={container}
                                featureData={featureData}
                                allowAddCopyIconInOverlay={true}
                            />
                        )}
                    </span>
                )}

                {StatusIcon && statusIconConfig && (
                    <span
                        key={`node-icons-status-${treeNode.key}`}
                        className="nz-tree-node-nz-icon-div nz-tree-node-status-icon"
                    >
                        <Image
                            source={<StatusIcon
                                fill='none'
                                strokeWidth={1}
                                size={FnGetCssVariable('--image-size-1')} />}
                            uniqueName={`${treeNode.key}-icon-status`}
                            w={16}
                            tooltip={statusIconConfig.tooltip}
                            type='svg'
                        />
                    </span>
                )}

                {showDownloadIcon && (
                    <span
                        key={`node-icons-download-${treeNode.key}`}
                        className="nz-tree-node-nz-icon-div nz-node-download-cart-icon"
                        onClick={handleDownloadClick}
                        onMouseDown={(event) => event.stopPropagation()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                treeDataProps.onAddToDownloadCart?.(treeNode);
                            }
                        }}
                    >
                        <Image
                            source={<Cart24x24
                                fill='none'
                                strokeWidth={1}
                                size={FnGetCssVariable('--image-size-1')} />}
                            uniqueName={`${treeNode.key}-icon-download-cart`}
                            w={16}
                            tooltip={"Add to Download cart"}
                            type='svg'
                        />
                    </span>
                )}
            </span>
        );
    };



    return (
        <span
            key={`node-title-${treeNode.key}`}
            rel="tooltip"
            title={nodeTooltip}
            data-html="true"
            className={'nz-tree-node-title'}
            style={{ fontWeight: `${treeNode.IsNZ || treeNode.IsTemplate ? "600" : "inherit"}` }}
            id={treeNode.EntID || treeNode.key}
            node-info={JSON.stringify(clonedNode)}
        >
            <span className="nz-tree-node-content">
                <span key={`node-title-name-${treeNode.key}`} className={treeNode.EntID} node-info={JSON.stringify(clonedNode)}>
                    {renderNodeName()}
                </span>
                <Fragment key={`node-title-icon-${treeNode.key}`}>
                    {renderIcon()}
                </Fragment>
            </span>
        </span>
    );
}
export { TreeNodeTitle }
