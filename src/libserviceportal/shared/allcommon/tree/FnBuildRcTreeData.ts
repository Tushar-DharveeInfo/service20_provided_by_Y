
import { ITreeNode } from "../../allinterface/tree/ITreeControl";
// This function convert flat data to Hierarchy data 
function FnBuildRcTreeData(data: any[], currentNodeId: string | null = null, featureId: string | null = null, instanceName?: string, disableSort?: boolean): ITreeNode[] {
    try {
        const nodeMap: { [key: string]: ITreeNode } = {};

        const nodeTypePropertyMap: { [key: string]: string[] } = {
        };

        // Function to extract properties based on the node type
        const extractProperties = (item: any, nodeType: string): Partial<ITreeNode> => {
            const nodeProperties = nodeTypePropertyMap[nodeType] || [];
            const nodeData: Partial<ITreeNode> = {};

            // Dynamically assign properties from the item to the node based on the node type's properties
            nodeProperties.forEach(prop => {
                const propKey = prop.replace(nodeType, ''); // Remove node type prefix for cleaner property names
                nodeData[propKey] = item[prop];
            });

            return nodeData;
        };
        for (let index = 0; index < data.length; index++) {
            const item = data[index];

            const nodeTypes = ['Manufacturer', 'Eqtype', 'Product', 'View', 'Device', 'DeviceView', 'Entity', 'PropertyGroup', 'Property', 'Root', 'Group', 'SubGroup'];
            for (let i = 0; i < nodeTypes.length; i++) {
                const deviceParentType = item["LocationType"];
                const nodeType = nodeTypes[i];
                const id = item[`${nodeType}EntID`];
                const parentId = item[`${nodeType}ParentID`] ? item[`${nodeType}ParentID`] : item[`${nodeType}ParentEntID`];
                if (id) {
                    if (!nodeMap[id]) {
                        const nodeData = extractProperties(item, nodeType);


                        nodeMap[id] = {
                            title: item[`${nodeType}Name`] || '',
                            key: id,
                            NodeEntID: id,
                            NodeEntityname: item[`${nodeType}EntityName`] || '',
                            Name: item[`${nodeType}Name`] || '',
                            PGClassName: item[`${nodeType}PGClassName`] || '',
                            Description: item[`${nodeType}Description`] || '',
                            Type: item[`${nodeType}Type`] || '',
                            icon: null,
                            NodeType: item[`${nodeType}NodeType`] || '',
                            HasChildren: item[`${nodeType}HasChildren`] || 0,
                            IsNZ: item[`${nodeType}IsNZ`] || false,
                            Secured: item[`${nodeType}Secured`] || false,
                            NodeState: item[`${nodeType}NodeState`] || "Ready",
                            stepNo: item[`${nodeType}StepNo`] || nodeTypes.indexOf(nodeType) + 1,
                            parentEntID: parentId || null,
                            treetype: nodeType,
                            checkable: false,
                            isLeaf: (item[`${nodeType}HasChildren`] || 0) >= 1 ? false : true,
                            MountedDeviceEntID: item[`${nodeType}MountedDeviceEntID`] || "",
                            MountedDeviceViewEntID: item[`${nodeType}MountedDeviceViewEntID`] || "",
                            MountedDeviceName: item[`${nodeType}MountedDeviceName`] || "",
                            MountedDeviceNodeType: item[`${nodeType}MountedDeviceNodeType`] || "",
                            MountedDeviceDescription: item[`${nodeType}MountedDeviceDescription`] || "",
                            MountedDeviceHasPowerPort: item[`${nodeType}MountedDeviceHasPowerPort`] || 0,
                            MountedDeviceHasNetworkPort: item[`${nodeType}MountedDeviceHasNetworkPort`] || 0,
                            MountedDeviceIntelDCMState: item[`${nodeType}MountedDeviceIntelDCMState`] || "",
                            MountedDeviceEntityName: item[`${nodeType}MountedDeviceEntityName`] || "",
                            MountedDeviceWidth: item[`${nodeType}MountedDeviceWidth`] || "",
                            MountedDeviceHeight: item[`${nodeType}MountedDeviceHeight`] || "",
                            MountedDeviceLength: item[`${nodeType}MountedDeviceLength`] || "",
                            MountedDeviceSlotsNeeded: item[`${nodeType}MountedDeviceSlotsNeeded`] || "",
                            MountedDeviceSecured: item[`${nodeType}MountedDeviceSecured`] || "",
                            EQID: item[`${nodeType}EQID`] || "",
                            ParentEQID: item[`${nodeType}ParentEQID`] || "",
                            HasNetworkPorts: item[`${nodeType}HasNetworkPorts`] || 0,
                            HasPowerPorts: item[`${nodeType}HasPowerPorts`] || 0,
                            IntelDCMState: item[`${nodeType}IntelDCMState`] || "",
                            Gender: item[`${nodeType}Gender`] || null,
                            IsPortFiber: item[`${nodeType}IsPortFiber`] || null,
                            PortStatus: item[`${nodeType}PortStatus`] || "Normal",
                            SlotsNeeded: item[`${nodeType}SlotsNeeded`] || 0,
                            ShapeID: item[`${nodeType}ShapeID`] || null,
                            ViewShortName: item[`${nodeType}ShortName`] || null,
                            ParentName: item[`${nodeType}ParentName`] || null,
                            MaxInstances: item[`${nodeType}MaxInstances`] || 0,
                            IsPatchPort: item[`${nodeType}IsPatchPort`] || false,
                            DisplayOrder: item[`${nodeType}DisplayOrder`] || 0,
                            MountPosition: item[`${nodeType}MountPosition`] || -1,
                            DetailsJson: item[`${nodeType}DetailsJson`] || "",
                            HasLayout: item[`${nodeType}HasLayout`] ?? undefined,
                            EQType: item[`${nodeType}EQType`] || "",
                            Height: item[`${nodeType}Height`] || "0",
                            Width: item[`${nodeType}Width`] || "0",
                            Length: item[`${nodeType}Length`] || "0",
                            DeviceEntId: item[`${nodeType}DeviceEntId`] || "",
                            DeviceViewEntId: item[`${nodeType}DeviceViewEntId`] || "",
                            WOID: item[`${nodeType}WOID`] || "",
                            TeamIDList: item[`${nodeType}TeamIDList`],
                            TagIDList: item[`${nodeType}TagIDList`],
                            TenantIDList: item[`${nodeType}TenantIDList`],
                            VendorIDList: item[`${nodeType}VendorIDList`],
                            ContainedByDeviceID: item[`${nodeType}ContainedByDeviceID`],
                            children: [],
                            ParentNodeType: nodeType.toLowerCase() === "device" ? deviceParentType : "",
                            ...nodeData
                        };
                    }
                }
            };
        };
        // Establish parent-child relationships
        for (let index = 0; index < data.length; index++) {
            const item = data[index];

            const nodeTypes = ['Manufacturer', 'Eqtype', 'Product', 'View', 'Device', 'DeviceView', 'PropertyGroup', 'Property', 'Root', 'Group', 'SubGroup'];
            for (let index = 0; index < nodeTypes.length; index++) {
                const nodeType = nodeTypes[index];
                const id = item[`${nodeType}EntID`];
                const parentId = item[`${nodeType}ParentID`] ? item[`${nodeType}ParentID`] : item[`${nodeType}ParentEntID`];

                if (parentId && nodeMap[parentId]) {
                    if (id && nodeMap[id]) {
                        if (!nodeMap[parentId].children!.find(child => child.key === id)) {
                            nodeMap[parentId].children!.push(nodeMap[id]);
                        }
                    }
                }
            };
        };

        let rootData: ITreeNode[] = [];
        // Extract root nodes (nodes with no parent)
        if (currentNodeId) {
            rootData = Object.values(nodeMap).filter(node => node.parentEntID === currentNodeId);
        }
        else {
            rootData = Object.values(nodeMap).filter(node => !node.parentEntID);
        }
        const sortTreeNodes = (nodes: ITreeNode[], parentNode?: ITreeNode) => {
            if (!Array.isArray(nodes) || nodes.length === 0) return;
            const parentType = parentNode?.treetype?.toLowerCase();
            const isRackParent =
                parentNode?.NodeEntityname?.toLowerCase() === "__rack" &&
                parentNode?.treetype?.toLowerCase() === "deviceview";
            const isDeviceViewParent = parentType === "deviceview";
            if (isRackParent || isDeviceViewParent) {
                // Group children by NodeType
                const groupedByType: Record<string, ITreeNode[]> = {};

                nodes.forEach(node => {
                    const typeKey = node.Name ? node.Name.split('#')[0] : node.NodeType?.toLowerCase() ?? "unknown";
                    if (!groupedByType[typeKey]) groupedByType[typeKey] = [];
                    groupedByType[typeKey].push(node);
                });
                // Sort each NodeType group by DisplayOrder 
                Object.keys(groupedByType).forEach(typeKey => {
                    groupedByType[typeKey].sort((a, b) => {
                        const orderA = a.DisplayOrder ?? 0;
                        const orderB = b.DisplayOrder ?? 0;
                        return isRackParent ? orderB - orderA : orderA - orderB;
                    });
                });

                // Merge all groups into a single array, maintaining NodeType grouping order
                const sortedKeys = Object.keys(groupedByType).sort((a, b) => {
                    return isRackParent ? b.localeCompare(a) : a.localeCompare(b);
                });
                const mergedNodes = sortedKeys.flatMap(key => groupedByType[key]);

                // Replace nodes content with sorted result
                nodes.splice(0, nodes.length, ...mergedNodes);
            } else {
                // Normal ascending sort
                nodes.sort((a, b) => {
                    const orderA = a.DisplayOrder ?? 0;
                    const orderB = b.DisplayOrder ?? 0;
                    return orderA - orderB;
                });
            }

            // Recurse for all children
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    sortTreeNodes(node.children, node);
                }
            });
        };

        if (!disableSort) {
            sortTreeNodes(rootData);
        }

        return rootData;
    } catch (error) {
        console.error(
            "Error in function(FnBuildRcTreeData): ",
            error
        );
        return [];
    }
}

export { FnBuildRcTreeData }