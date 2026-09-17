
import { ITreeNode } from '../../allinterface/tree/ITreeControl';
import { Image } from '../../basic/image/Image';
import { FnGetIconForTreeNode } from '../../allcommon/tree/FnGetIconForTreeNode';
import { FnGetCssVariable } from '../../allcommon/FnGetCssVariable';

const TreeNodeIcon = (treeNode: ITreeNode, instanceName: string) => {
    const normalizedNodeType = treeNode.NodeType?.toString().replace('__', '').replace(' ', '');
    const lowerTreeType = treeNode.treetype?.toLowerCase();

    const createIconData = (
        iconName: string,
        tooltip?: string,
        extension: 'svg' | 'png' = 'svg'
    ) => ({
        path: FnGetIconForTreeNode(iconName),
        extension,
        tooltip,
    });

    const getImageSource = () => {
        // Device Model Tree
        if (instanceName === 'nz-device-model-tree') {

            if (treeNode.NodeType === 'Manufacturer') {
                return createIconData(
                    `${normalizedNodeType}24x24`,
                    normalizedNodeType
                );
            }

            if (lowerTreeType === 'eqtype') {
                return createIconData(
                    `${normalizedNodeType}24x24`,
                    normalizedNodeType
                );
            }

            if (lowerTreeType === 'product') {

                const eqType =
                    treeNode.EQType?.toString().replace('__', '').replace(' ', '') ||
                    'Default';

                return createIconData(
                    `${eqType}24x24`,
                    eqType
                );
            }

            if (lowerTreeType === 'view') {

                const viewName =
                    treeNode.Name?.toString().replace('__', '').replace(' ', '') ||
                    'Default';

                return createIconData(
                    `${viewName}24x24`,
                    viewName
                );
            }
        }
        if (normalizedNodeType?.toLowerCase() === 'mfg') {
            return createIconData(
                `Manufacturer24x24`,
                normalizedNodeType
            );
        }

        // Fallback
        return createIconData('Setting24x24');
    };

    const imageSourceData = getImageSource();

    return (
        <Image
            uniqueName={`node-icon-${treeNode.Name}-${treeNode.key}`}
            source={
                <imageSourceData.path
                    fill='none'
                    strokeWidth={1}
                    size={FnGetCssVariable('--image-size-1')}
                />
            }
            w='var(--image-size-1)'
            tooltip={imageSourceData.tooltip}
            type={imageSourceData.extension === 'svg' ? 'svg' : 'png'}
        />
    );
};

export { TreeNodeIcon };