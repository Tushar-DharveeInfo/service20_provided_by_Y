
import { Fragment, MouseEvent } from 'react'
import { Cart24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../allcommon/FnGetCssVariable';
import { FnGetLeafStatusIconConfig } from '../../allcommon/tree/FnGetLeafStatusIconConfig';
import { ITreeNode } from '../../allinterface/tree/ITreeControl';
import { IFeatureTree } from '../../allinterface/tree/ITreeForHierarchicalDataContainer';
import { Image } from '../../basic/image/Image';

const TreeNodeTitle = (treeNode: ITreeNode, treeDataProps: IFeatureTree) => {
    const clonedNode = { ...treeNode, title: "", icon: null, children: [] };
    const nodeTooltip = `${treeNode.Description ?? ""}`
    const titleContent = `${treeNode.Name}` || "";

    const renderNodeName = () => {
        return (
            <Fragment key={`node-title-content-${treeNode.key}`}>
                {treeNode.TableLabel || titleContent}
            </Fragment>
        );
    };

    const handleDownloadClick = (event: MouseEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
        treeDataProps.onAddToDownloadCart?.(treeNode);
    };

    const renderIcon = () => {
        const showDownloadIcon =
            treeNode.treetype?.toLowerCase() === "product" &&
            !!treeDataProps.onAddToDownloadCart;
        const statusIconConfig = treeDataProps.showLeafStatusIcon
            ? FnGetLeafStatusIconConfig(treeNode)
            : null;
        const StatusIcon = statusIconConfig?.Icon;

        return (
            <span className="nz-tree-node-icons-wrapper" key={`node-icons-${treeNode.key}`}>
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
