
import { ITreeNode } from '../../allinterface/tree/ITreeControl';
import { Image } from '../../basic/image/Image';
import { FnGetIconForTreeNode } from '../../allcommon/tree/FnGetIconForTreeNode';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';

const TREE_INSTANCES = [
    'dc_explorer_tree',
    'filter_tree_container',
    'feature-power-bi-tree',
];

const TreeNodeIcon = (treeNode: ITreeNode, instanceName: string) => {
    const normalizedNodeType = treeNode.NodeType?.toString().replace('__', '').replace(' ', '');
    const normalizedEntityName =
        treeNode.NodeEntityname?.toString().replace('__', '').replace(' ', '') || 'Default';

    const lowerTreeType = treeNode.treetype?.toLowerCase();

    const viewIcon =
        treeNode.Name?.toLowerCase().includes('front')
            ? 'F'
            : treeNode.Name?.toLowerCase().includes('rear')
                ? 'R'
                : null;

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

        // Explorer / Filter / Power BI Tree
        if (TREE_INSTANCES.includes(instanceName)) {

            if (
                treeNode.NodeEntityname &&
                !viewIcon &&
                !treeNode.NodeEntityname.toString().includes('__')
            ) {
                return createIconData(
                    `${normalizedEntityName}24x24`,
                    normalizedEntityName
                );
            }

            if (
                !viewIcon &&
                treeNode.NodeEntityname &&
                treeNode.NodeEntityname.toString().includes('__')
            ) {

                if (treeNode.treetype === 'DeviceSlot') {

                    const slotIcon =
                        treeNode.PortStatus &&
                            treeNode.PortStatus !== 'Normal'
                            ? `Slot${treeNode.PortStatus}`
                            : 'Slot';

                    return createIconData(
                        `${slotIcon}24x24`,
                        treeNode.PortStatus ?? 'Slot'
                    );
                }

                return createIconData(
                    `${normalizedEntityName}24x24`,
                    normalizedEntityName
                );
            }

            if (
                ['productnumber', 'manufacturer'].includes(lowerTreeType ?? '')
            ) {
                return createIconData(
                    `${treeNode.treetype}24x24`,
                    treeNode.treetype
                );
            }

            if (
                normalizedNodeType?.toLowerCase() === 'eqtype' &&
                treeNode.Name
            ) {
                return createIconData(
                    `${treeNode.Name.replace(' ', '')}24x24`,
                    treeNode.Name
                );
            }

            if (viewIcon) {
                return createIconData(
                    `${viewIcon}24x24`,
                    treeNode.Name ?? undefined
                );
            }
        }

        // Features Tree
        if (instanceName === 'features_tree' && treeNode.Name) {
            return createIconData(
                `${treeNode.Name.replace(' ', '')}24x24`,
                treeNode.Name
            );
        }

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

        // Generic Node Type Icon
        if (normalizedNodeType) {
            return createIconData(
                `${normalizedNodeType}24x24`,
                normalizedNodeType
            );
        }

        // Hardware Entity
        if (treeNode.HwEntityName) {
            return createIconData(
                `${treeNode.Name}24x24`,
                treeNode.HwEntityName
            );
        }

        // View Icons
        if (lowerTreeType === 'views' && viewIcon) {
            return createIconData(
                `${viewIcon}24x24`,
                viewIcon
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