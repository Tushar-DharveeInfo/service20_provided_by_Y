
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { Key } from 'rc-tree/lib/interface';
import { useStatusBarContext } from '../context/hooks/StatusBarHooks';
import { useMainAppContext } from '../context/hooks/MainAppHooks';
import './DeviceModel.css'
import { deviceModelTabs } from '../../constants/Feature';
import { IFeatureTree, ITreeForHierarchicalDataContainer } from '../allinterface/tree/ITreeForHierarchicalDataContainer';
import { IExpandedNodeInfo, ISelectedNodeInfo } from '../allinterface/tree/ITreeControl';
import { ITreeNode } from '../allinterface/tree/ITreeControl';

import { ResultTab } from './ResultTab';
import { SearchTab } from './SearchTab';
import { ActionLabelTabs } from '../basic/actionlabeltabs/ActionLabelTabs';
import { OverlayTab } from '../basic/overlaytab/OverlayTab';
import { PropertyTab } from './PropertyTab';
import { formControls } from '../allcommon/devicemodel/formControlsJsonDeviceModel';
import { FnConvertFlatDataToHierarchyData } from '../allcommon/tree/FnConvertFlatDataToHierarchyData';
import { FnGetAutoExpandNodeKeys } from '../allcommon/tree/FnGetAutoExpandNodeKeys';
import { FnUpdateNodeWithTitleAndIcon } from '../allcommon/tree/FnUpdateNodeWithTitleAndIcon';
import { IView } from '../allinterface/deviceview/IView';
import { IActionLabelTabs } from '../allinterface/basic/IActionLabelTabs';
import {
	IDeviceEqTypeRecord,
	IDeviceFormFieldValue,
	IDeviceModel,
	IDeviceModelProfileString,
	IDeviceSearchOption,
	IDeviceViewRecord,
	IDeviceWildSearchItem,
	IExternalSearch,
	IFilterMfgEntry,
	IFlatTreeFormattedRow,
	IFileObject,
	IJsonDataMap,
	IMatchScoreTreeGroup,
	IMfgAcronymItem,
	IPropertyTabData,
	IShapeRecord,
	JsonRecord,
} from '../allinterface/devicemodel/IDeviceModel';
import { DeviceModelFEnums, Lib } from '../alldefaultprops/devicemodel/DeviceModelEnums'
import { FnGetLibJson } from '../allcommon/devicemodel/FnGetLibJson';
import { FnGetSearchResults, transformDeviceData } from '../allcommon/devicemodel/FnExtractKeyObjects';
import { FnGetKeyFromEntId } from '../allcommon/tree/FnGetKeyFromEntId';
import { FnProcessMfgAcronym } from '../allcommon/devicemodel/FnProcessMfgAcronym';
import { FnGetEnvVariableByKey } from '../../appcontainer/allcommon/FnGetEnvVariableByKey';
import { envVarEnums } from '../../appcontainer/alldefaultprops/DefaultPropsAppContainer';
import { wildSearch } from '@n20a/libmiscfn';
import { YesNoFormContainer } from '../basic/yesnoformcontainer/YesNoFormContainer';
import '@n20a/libform/style.css'
import { NodeDragEventParams } from 'rc-tree/lib/contextTypes';
import { Label } from '../basic/label/Label';

/* True when DeviceModel is searching the local NetZoom device or cable library. */
const isLocalLibRadio = (radio: string): boolean =>
	radio === DeviceModelFEnums.NetZoomDeviceLibrary

/* Resolves mfg / prodno / EQID from a selected product tree node. */
const getProductDownloadCartPayload = (node: ITreeNode): { mfg: string; prodno: string; EQID: string } => {
	const EQID = String(node.EQID ?? node.NodeEntID ?? '')
	const prodno = String(node.Name ?? '')
	const parentId = typeof node.parentEntID === 'string' ? node.parentEntID : ''
	const mfg = parentId.includes('##') ? parentId.split('##')[0] : String(node.ParentName ?? '')
	return { mfg, prodno, EQID }
}

const leftSideTabs: IActionLabelTabs = {
	labels: [
		{
			label: 'Found in Library',
			tooltip: 'Found in Library tab'
		}
	],
	handleMouse: () => {
	},
	allowStatusIcon: false
};

const onlySearchTab: IActionLabelTabs = {
	labels: [
		{
			label: 'Search library',
			tooltip: 'Search library tab'
		}

	],
	handleMouse: () => {
	},
	allowStatusIcon: false
};
const RightSideTabs: IActionLabelTabs = {
	labels: [
		{
			label: 'Search library',
			tooltip: 'Search library tab'
		},
		{
			label: 'Property',
			tooltip: 'Property tab'
		}

	],
	handleMouse: () => {
	},
	allowStatusIcon: false
};
/* Returns true when value is a plain object (not null or array). */
const isRecord = (value: unknown): value is JsonRecord =>
	value !== null && typeof value === 'object' && !Array.isArray(value);

/* Parses a JSON string; returns null on failure. */
const parseJsonString = (value: string): unknown => {
	try {
		return JSON.parse(value);
	} catch (error) {
		console.error('DeviceModel: failed to parse JSON string', error);
		return null;
	}
};


/* Coerces an unknown value to a device search option object. */
const toDeviceSearchOption = (value: unknown): IDeviceSearchOption | null =>
	isRecord(value) ? value as IDeviceSearchOption : null;

/* Reads manufacturer name from profile, treating "All" as empty. */
const getProfileManufacturerValue = (
	profile: IDeviceModelProfileString
): string => {
	const manufacturer = profile.Manufacturer;
	if (typeof manufacturer === 'string') {
		return manufacturer === 'All' ? '' : manufacturer;
	}
	const option = toDeviceSearchOption(manufacturer);
	if (!option) {
		return '';
	}
	const optionValue = option.value ?? option.mfg;
	return optionValue === 'All' ? '' : (optionValue ?? '');
};

/* Extracts manufacturer name from a form field value or selected option. */
const getMfgNameFromFormValue = (
	formValue: IDeviceFormFieldValue,
	selectedOption?: IDeviceSearchOption
): string =>
	(typeof formValue !== 'string' ? formValue.mfg : undefined) ?? selectedOption?.mfg ?? '';

const DeviceModel = (props: IDeviceModel) => {
	const BASE_URL_DEVICE_MODEL = FnGetEnvVariableByKey(envVarEnums.BASE_URL_LIB);
	const [isDeviceURLAvailable, setIsDeviceURLAvailable] = useState<boolean>(true);
	const [isDeviceUrlValidated, setIsDeviceUrlValidated] = useState<boolean>(true);
	const [leftSideSelectedTab, setLeftSideSelectedTab] = useState<string>('')
	const [rightSideSelectedTab, setRightSideSelectedTab] = useState<string>('Search library')
	const [leftSideTabsObj, setLeftSideTabsObj] = useState<IActionLabelTabs>(leftSideTabs)
	const [wildsearchData, setWildsearchData] = useState<IDeviceWildSearchItem[] | null>(null)

	const [disableFromWhileSearching, SetDisableFromWhileSearching] = useState<boolean>(false)
	// search tabs state start
	const [selectedRadio, setSelectedRadio] = useState<string>(
		DeviceModelFEnums.NetZoomDeviceLibrary
	)
	const [searchText, setSearchText] = useState<string>('')
	const optionDataRef = useRef<IDeviceSearchOption[]>([])
	const [profileString, setProfileString] = useState<IDeviceModelProfileString>({})
	const [views, setView] = useState<IView[]>([])
	const [selectedTabViewName, setSelectedTabViewName] = useState<string>("")
	// search tabs state end 
	// property tab state start
	const [propertyTabData, setPropertyTabData] = useState<IPropertyTabData>([])
	// property tab state end
	//Result Tab State start 
	const [treeDataResult, setTreeDataResult] = useState<ITreeNode[]>([]);
	const [defaultExpandedKeysResult, setDefaultExpandedKeysResult] = useState<Key[]>([]);
	const [defaultSelectedKeysResult, setDefaultSelectedKeysResult] = useState<Key[]>([]);
	const [defaultSelectedNodeInfo, setDefaultSelectedNodeInfo] = useState<ISelectedNodeInfo | null>(null);
	const [filterMfg, setFilterMfg] = useState<IFilterMfgEntry[] | null>(null)
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [isLensDirty, setIsLensDirty] = useState<boolean>(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");
	const [showOkButtonOnly, setShowOkButtonOnly] = useState(false);
	const [showMessage, setShowMessage] = useState(false);

	const statusBarContext = useStatusBarContext()
	const mainAppContext = useMainAppContext();

	// const { setDragItem, reloadTreeFor } = useDragContext()
	const allowDrag = true;

	const eqTypeApiDataRef = useRef<IDeviceEqTypeRecord[] | null>(null)
	let featureTreeProps: IFeatureTree = {
		instanceName: "nz-device-model-tree",
		hideKebabMenu: true,
		allowCheckbox: false,
		allowIcon: true,
		isAllowDrag: false,
		hideCopyIcon: false,
		reuseFromCache: false,
		isAllowDrop: false,
		allowInternalDrag: isLocalLibRadio(selectedRadio) ? allowDrag : true,
		openAllNodes: false,
		allowCheckStrictly: false,
		onAddToDownloadCart: (node: ITreeNode) => {
			const { mfg, prodno, EQID } = getProductDownloadCartPayload(node)
			if (props.addToDownloadCart) {
				props.addToDownloadCart(mfg, prodno, EQID)
			} else {
				alert(`mfg: ${mfg}\nprodno: ${prodno}\nEQID: ${EQID}`)
			}
		},
	};

	// useEffect(() => {
	// 	const validateDeviceUrl = async () => {
	// 		setIsDeviceUrlValidated(false);
	// 		if (
	// 			!mainAppContext.isInternetAvailable ||
	// 			!BASE_URL_DEVICE_MODEL?.trim()
	// 		) {
	// 			setIsDeviceURLAvailable(false);
	// 			setIsDeviceUrlValidated(true);
	// 			return;
	// 		}
	// 		try {
	// 			await axiosInterceptorForHead({
	// 				url: BASE_URL_DEVICE_MODEL,
	// 				onHeadersReceived: (
	// 					_headers: Record<string, string> | null,
	// 					isReachable: boolean,
	// 					error: string | unknown
	// 				) => {
	// 					setIsDeviceURLAvailable(isReachable);
	// 					setIsDeviceUrlValidated(true);
	// 					if (!isReachable) {
	// 						console.error(
	// 							"Remote Device Model Library is not available.",
	// 							error
	// 						);

	// 					}
	// 				}
	// 			});

	// 		} catch (error) {
	// 			console.error(
	// 				"Failed to validate Device Model URL.",
	// 				error
	// 			);
	// 			setIsDeviceURLAvailable(false);
	// 			setIsDeviceUrlValidated(true);
	// 		}
	// 	};

	// 	void validateDeviceUrl();

	// }, [
	// 	BASE_URL_DEVICE_MODEL,
	// 	mainAppContext.isInternetAvailable
	// ]);

	/* Device Library only when ShowOnlyLibraryRadioB (hides radios in SearchTab). */
	useEffect(() => {
		if (props.ShowOnlyLibraryRadioB) {
			setSelectedRadio(DeviceModelFEnums.NetZoomDeviceLibrary);
		}
	}, [
		props.ShowOnlyLibraryRadioB,
	]);

	const libraryDocumentSource = useMemo(() => {
		// if (selectedRadio !== DeviceModelFEnums.NetZoomDeviceLibrary) {
		// 	return {
		// 		label: `API (${selectedRadio})`,
		// 		tooltip: `Device data is loaded from the ${selectedRadio} API.`,
		// 	};
		// }

		if (!isDeviceUrlValidated) {
			return {
				label: 'Loading...',
				tooltip: 'Validating remote device library availability.',
			};
		}

		if (
			!isDeviceURLAvailable &&
			!mainAppContext.isInternetAvailable &&
			!BASE_URL_DEVICE_MODEL?.trim()
		) {
			return {
				label: 'Local Library',
				tooltip: 'Library documents are loaded from the local privatelib folder.',
			};
		}


	}, [
		selectedRadio,
		isDeviceURLAvailable,
		isDeviceUrlValidated,
		mainAppContext.isInternetAvailable,
		BASE_URL_DEVICE_MODEL,
	]);

	/* Returns true when internal tree drag is allowed for view/product nodes. */
	const canAllowTreeDrag = (sourceNode: ITreeNode) =>
		!!featureTreeProps.allowInternalDrag &&
		["view", "product"].includes(sourceNode.treetype?.toLowerCase());

	const treeProps: ITreeForHierarchicalDataContainer = {
		uniqueName: "ResultTree", // Unique identifier
		featureId: props.featureId, // Feature ID
		featureTreeProps: featureTreeProps, // Tree control properties
		allowGenerateTreeData: false, // indicates whether need to generate treedata from API data
		defaultExpandedKeys: [], // default expanded keys to set if already tree data generated
		defaultSelectedKeys: [], // default selected keys to set if already tree data generated
		defaultCheckedKeys: [], // default checked keys to set if already tree data generated
		defaultSelectedNodeInfo: undefined, // default selected node set if needed
		isFloorTree: false, // Indicates this is not a Floor Pane tree
		allowAPICallOnExpand: false, // Enables API calls on node expansion
		allowAdd: false, // Allows adding new nodes
		allowEdit: false, // Allows editing nodes
		allowDelete: false, // Allows deleting nodes
		disableAdd: true, // disable adding new nodes
		disableEdit: false, // disable editing nodes
		disableDelete: false, // disable deleting nodes
		allowMultiple: true, // Allows multiple selections
		className: "tree-container", // Custom CSS class
		selectedNodeExplorer: undefined,
		apiData: undefined
	};
	// Result tabs state end

	/* Loads property data and views for the selected tree node. */
	const handleShowPropertyTab = async (info: ISelectedNodeInfo, _selectedTabName: string, updatedTreeData?: ITreeNode[]) => {
		try {
			if (info.node.DetailsJson || info.node.NodeType === "Product" || (!info.node.DetailsJson && info.node.treetype === "View")) {
				setRightSideSelectedTab("Property")
				let details: JsonRecord[] | JsonRecord | null = null
				if (info.node.DetailsJson) {
					try {
						details = parseJsonString(info.node.DetailsJson as string) as JsonRecord[] | JsonRecord | null
					} catch (error) {
						setDeleteOpen(true)
						setShowOkButtonOnly(true)
						setConfirmMessage('Remote Device Library is not available!')
						console.error('DeviceModel: failed to parse DetailsJson', error)
						details = null
					}
				}

				if (!info.node.DetailsJson) {
					const eqidsSortName = FnProcessMfgAcronym(info.node.EQID as string)
					if (isLocalLibRadio(selectedRadio)) {
						try {
							details = await FnGetLibJson('details/' + eqidsSortName + '/' + info.node.EQID, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as JsonRecord[] | JsonRecord | null
						} catch (error) {

							console.error('DeviceModel: failed to fetch lib device details', error);
							details = null;
						}

					}
				}
				if (details && isRecord(details) && details.Details) {
					details = details.Details as JsonRecord[] | JsonRecord
				}
				if (Array.isArray(details) && details.length) {

					if (details[0].Properties) {
						let property: unknown = typeof details[0].Properties === "string" ? parseJsonString(details[0].Properties as string) : details[0].Properties
						if (Array.isArray(property) && property.length) {
							const propertyJson = typeof property[0].PropertyJSON === "string" ? parseJsonString(property[0].PropertyJSON as string) : property[0].PropertyJSON
							let data = transformDeviceData(propertyJson)
							setPropertyTabData(data)

						}
					} else {
						setPropertyTabData([])
					}

					if (details[0].Views) {

						let Views: IDeviceViewRecord[] = typeof details[0].Views === "string" ? parseJsonString(details[0].Views as string) as IDeviceViewRecord[] : details[0].Views as IDeviceViewRecord[]
						let name = info.node.Name
						if (info.node.treetype === "View" && updatedTreeData && info.node.parentEntID) {
							const parentNode = FnGetKeyFromEntId(updatedTreeData, info.node.parentEntID, true)
							if (parentNode.node && parentNode.node.node.Name) {
								name = parentNode.node.node.Name as string
							}
						}
						if (Views.length) {

							let viewTabs: IView[] = []
							let shapes: IShapeRecord[] | undefined;
							if (isLocalLibRadio(selectedRadio)) {
								try {
									const eqidsSortName = FnProcessMfgAcronym(Views[0].EQID as string)
									shapes = await FnGetLibJson('shapes/' + eqidsSortName + '/' + Views[0].EQID, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as IShapeRecord[] | undefined;
								} catch (error) {
									console.error('DeviceModel: failed to fetch lib shapes', error);
									shapes = [];
								}

							}

							const viewObj = createViewsForShape(shapes ?? [], name as string)

							viewTabs = viewObj
							if (info.node.treetype === "View") {
								setSelectedTabViewName(info.node.Name as string)
							} else {
								setSelectedTabViewName("F")
							}
							setView([...viewTabs])
						}
					} else {
						setView([])
					}
				}
			}
		} catch (error) {
			console.error('DeviceModel: handleShowPropertyTab failed', error)
		}
	}

	/* Maps shape records into Front/Rear view tabs for the Property panel. */
	function createViewsForShape(data: IShapeRecord[], selectedEqid: string): IView[] {
		return data
			.filter((item): item is IShapeRecord & { ViewShortName: string } =>
				typeof item.ViewShortName === 'string' && item.ViewShortName.length > 0
			)
			.sort((a, b) => a.ViewShortName.localeCompare(b.ViewShortName))
			.map(item => ({
				svg: item.bSVG?.trim() ?? "",
				viewTitle: selectedEqid,
				uniqueName: `svg_${item.ShapeID}_${item.ViewShortName}`,
				tab: {
					label: item.ViewShortName === "F" || item.ViewShortName === "Front" ? "Front" : "Rear",
					tooltip: item.ViewShortName === "F" || item.ViewShortName === "Front" ? "Front" : "Rear",
				},
			}));
	}

	/* Handles tree node selection on the Result tab. */
	const handleNodeSelectTree = (_selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[], selectedTabName: string) => {
		if (defaultSelectedKeysResult?.length && defaultSelectedKeysResult[0] === info.node.key) return;
		setDefaultExpandedKeysResult(expandedKeys);
		setDefaultSelectedKeysResult([info.node.key]);
		setLeftSideTabsObj(leftSideTabs)
		setDefaultSelectedNodeInfo(info);
		if (info.node.EQID && info.node.treetype === "View") {
			setView([])
		}
		if (info.node.NodeEntID && (info.node.treetype === "Product" || info.node.treetype === "ProductNumber" || info.node.treetype === "View")) {
			handleShowPropertyTab(info, selectedTabName, treeDataResult)
		} else {
			setRightSideSelectedTab(deviceModelTabs.Search)
			setPropertyTabData([])
			setView([])
		}
	}

	// resust tabs code end 

	// below code for default selection value of tabs
	useEffect(() => {
		if (!leftSideSelectedTab) {
			setLeftSideSelectedTab(leftSideTabs.labels[0].label)
		}
		if (!rightSideSelectedTab) {
			setRightSideSelectedTab(RightSideTabs.labels[0].label)
		}
	}, [leftSideSelectedTab, rightSideSelectedTab])



	useEffect(() => {
		const source = props.externalSearch?.Source;
		// if (typeof source === "string") {
		setTimeout(() => {
			handleValueChange(source as string, "Source", false);
		}, 1000);
		// }

	}, [props.externalSearch]);

	useEffect(() => {
		if (props.externalSearch?.Keywords && selectedRadio) {

			const keywords = props.externalSearch?.Keywords as string;
			const andOrValue =
				props.externalSearch?.AndOrFlag === undefined
					? ""
					: props.externalSearch?.AndOrFlag
						? "OR"
						: "AND";
			setTimeout(() => {
				setTreeDataResult([])
				setPropertyTabData([])
				setRightSideSelectedTab("Search")
				setSearchText(keywords)
				handleLensMouse(andOrValue, keywords)
			}, 1000);
		}
	}, [props.externalSearch?.Keywords, props.externalSearch?.AndOrFlag, selectedRadio])

	// below code for search tabs Start
	/* Updates search source radio selection and resets profile when source changes. */
	const handleValueChange = (value: string, name: string, isDefault?: boolean | undefined) => {
		if (!isDefault) {
			setWildsearchData(null)
			setProfileString({})
			setSelectedRadio(value ?? DeviceModelFEnums.NetZoomDeviceLibrary)
			if (!isLocalLibRadio(value ?? "")) {
				setFilterMfg(null)
			}
		}
	}
	/* Converts device search records into flat rows for hierarchy tree building.
	 * Product nodes only — Front/Rear view nodes are not added to the Result tree. */
	const formatDataForFlatTree = async (data: IDeviceEqTypeRecord[]): Promise<IFlatTreeFormattedRow[]> => {
		let formattedData: IFlatTreeFormattedRow[] = [];
		try {
			for (let index = 0; index < data.length; index++) {
				const element = data[index];
				let nodeObj: IDeviceEqTypeRecord = { ...element }
				const unicMfgEQType = data.filter((item) => item.mty === element.mty);

				if (data.length === 1 && unicMfgEQType.length === 1) {

					const eqidsSortName = element.id && FnProcessMfgAcronym(element.id)
					let detailsObj;
					if (isLocalLibRadio(selectedRadio)) {
						try {
							detailsObj = await FnGetLibJson('details/' + eqidsSortName + '/' + element.id, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined)
							setPropertyTabData(detailsObj as IPropertyTabData)
						} catch (error) {
							console.error('DeviceModel: failed to fetch lib details for flat tree', error);
							detailsObj = null;
						}

					}
					if (detailsObj && Array.isArray(detailsObj) && detailsObj.length) {
						const detail = detailsObj[0];
						nodeObj = { ...nodeObj, Views: detail.Views, details: JSON.stringify(detailsObj) }
					}
				}
				if (nodeObj) {
					formattedData.push({
						ManufacturerName: nodeObj.mfg,
						ManufacturerNodeType: "Manufacturer",
						ManufacturerEntID: `${nodeObj.mfg}`,
						ManufacturerHasChildren: nodeObj.mty ? true : false,
						EqtypeName: nodeObj.mty,
						EqtypeNodeType: nodeObj.ty,
						EqtypeEntID: `${nodeObj.mfg}##${nodeObj.mty}`,
						EqtypeParentID: `${nodeObj.mfg}`,
						EqtypeHasChildren: nodeObj.pno ? true : false,
						EqtypeDeviceEntId: nodeObj.entid,
						ProductEntID: nodeObj.id,
						ProductEQID: nodeObj.id,
						ProductEQType: nodeObj.ty,
						ProductName: nodeObj.pno,
						ProductDescription: nodeObj.md,
						ProductAttrib: nodeObj.Attrib,
						ProductDetailsJson: nodeObj.details,
						ProductParentID: `${nodeObj.mfg}##${nodeObj.mty}`,
						ProductNodeType: "Product",
						ProductHasChildren: false,
						ProductDeviceEntId: nodeObj.entid,
					})
				}
			}

		} catch (error) {
			console.error('DeviceModel: formatDataForFlatTree failed', error);
		}

		return formattedData
	}
	// 	sort z to a on rank field
	// get top 50 records
	// find distinct ranks
	// 	for each rank to fatch matching records 
	// sort them by mfg
	// append to final list
	/* Returns top 50 wild-search matches and their distinct match scores. */
	function getHighestMatchScoreRecords(
		dataArray: IDeviceWildSearchItem[]
	): {
		top50: IDeviceWildSearchItem[];
		distinctMatchScores: number[];
	} {
		if (!Array.isArray(dataArray) || dataArray.length === 0) {
			return { top50: [], distinctMatchScores: [] };
		}

		// Step 1: sort by matchScore (n ->  1)
		const sorted = [...dataArray].sort(
			(a, b) => b.matchScore - a.matchScore
		);

		// Step 2: take first 50 records (matchScore >= 3)
		const top50 = sorted
			.slice(0, 50)
			.map(item => {
				// Step 6: get prefix from id
				const prefixMatch = item.id?.slice(0, -3) ?? "";
				return {
					...item,
					mfgprefix: prefixMatch.toUpperCase(),
				};
			});

		// Step 3 & 4: get distinct matchScore list
		const distinctMatchScores = [
			...new Set(top50.map((item) => item.matchScore)),
		];

		return { top50, distinctMatchScores };
	}
	/* Decodes base64 lib search files into a map keyed by file name. */
	function convertFilesToJsonMap(files: IFileObject[]): IJsonDataMap {
		if (!Array.isArray(files) || files.length === 0) {
			return {};
		}

		const result: IJsonDataMap = {};

		for (const file of files) {
			try {
				const fileName = file.filePath.split("/").pop()?.replace(".json", "") ?? "unknown";
				const decodedContent = atob(file.content); // decode base64
				const jsonData = JSON.parse(decodedContent);
				result[fileName] = jsonData;
			} catch (error) {
				console.error(`Error decoding or parsing file: ${file.filePath}`, error);
			}
		}

		return result;
	}
	/* Merges Search arrays from all lib JSON files into one list. */
	function getCombinedSearchArray(jsonMap: IJsonDataMap): IDeviceEqTypeRecord[] {
		const combined: IDeviceEqTypeRecord[] = [];

		for (const key in jsonMap) {
			if (jsonMap[key]?.Search && Array.isArray(jsonMap[key].Search)) {
				combined.push(...jsonMap[key].Search!);
			}
		}

		return combined;
	}
	/* Filters search data and builds the Result tab hierarchy tree. */
	const makeResultTree = async (ApiData: IDeviceEqTypeRecord[] | null, eqtype: string, prod: string, filterMfgData: IFilterMfgEntry[] | null, disableSort?: boolean) => {
		console.log('ApiData makeResultTree', ApiData)
		try {
			let filterData: IDeviceEqTypeRecord[] = []
			filterData = ApiData
				? FnGetSearchResults(
					ApiData,
					filterMfgData ?? undefined,
					eqtype === 'All' ? '' : eqtype,
					prod === 'All' ? '' : prod,
					disableSort
				)
				: []
			if (filterData) {
				if (filterData.length > 50) {
					setShowMessage(true)
				}

				const apiData = await formatDataForFlatTree(filterData)
				const hierarchyData = await FnConvertFlatDataToHierarchyData({ "deviceModel": apiData }, null, props.featureId, "DeviceModel", disableSort)
				if (hierarchyData) {
					const updatedTreeData = FnUpdateNodeWithTitleAndIcon(hierarchyData, treeProps.featureTreeProps, props.featureId)

					if (updatedTreeData.length > 1) {
						const selectednode = updatedTreeData[0]
						const seletedNodeInfo: ISelectedNodeInfo = {
							event: "auto-select",
							selected: true,
							node: selectednode,
							selectedNodes: [selectednode],
						}
						setDefaultSelectedNodeInfo(seletedNodeInfo)
						handleShowPropertyTab(seletedNodeInfo, "result", updatedTreeData)
						setDefaultExpandedKeysResult([])
						setDefaultSelectedKeysResult([selectednode.key])
					} else {
						const expandedKeysData = await FnGetAutoExpandNodeKeys(updatedTreeData)
						if (expandedKeysData && expandedKeysData.nodeToSelect && expandedKeysData.nodeToSelect) {
							const autoSelectedNode = (expandedKeysData.nodeToSelect as ITreeNode);
							const seletedNodeInfo: ISelectedNodeInfo = {
								event: "auto-select",
								selected: true,
								node: expandedKeysData.nodeToSelect,
								selectedNodes: [expandedKeysData.nodeToSelect],
							}

							setDefaultSelectedNodeInfo(seletedNodeInfo)
							handleShowPropertyTab(seletedNodeInfo, "result", updatedTreeData)

							setDefaultSelectedKeysResult([autoSelectedNode.key])
							setDefaultExpandedKeysResult(expandedKeysData.keysToExpand)
						}
					}

					setTreeDataResult(updatedTreeData)
				}

			}

			setLeftSideTabsObj(leftSideTabs)
		} catch (error) {
			console.error('DeviceModel: makeResultTree failed', error)
			setLeftSideTabsObj(leftSideTabs)
		}
	}
	/* Runs keyword or filtered search and populates the Result tab tree. */
	const handleLensMouse = async (selectedRtmValue: string, searchKeywords?: string) => {
		try {

			setLeftSideTabsObj(leftSideTabs)
			setLeftSideSelectedTab("Found in Library")
			setRightSideSelectedTab("Search library")
			const mfg = getProfileManufacturerValue(profileString)
			const eqtypeFromProfile = profileString["Equipment Type"]
				? profileString["Equipment Type"] === "All"
					? ""
					: profileString["Equipment Type"]
				: ""
			// Cable library searches must restrict results to eqtype == Cable
			const eqtype = eqtypeFromProfile
			const prod = profileString["Product Number"] ? profileString["Product Number"] === "All" ? "" : profileString["Product Number"] : ""
			const keywordsToSearch = (searchKeywords ?? searchText)?.trim() ?? ""
			const andOrFlag: "AND" | "OR" = selectedRtmValue.toLowerCase() === 'or' ? "OR" : "AND"

			props.saveSearchCriteria?.(keywordsToSearch, andOrFlag, mfg, eqtype, prod)
			if (keywordsToSearch) {
				SetDisableFromWhileSearching(true)
				setFilterMfg(null)
				statusBarContext.setIsLoading(true)
				let searchData: Record<string, any>[] | null = wildsearchData;
				if (!wildsearchData) {
					if (isLocalLibRadio(selectedRadio)) {
						try {
							const wildsearchDataSet = await FnGetLibJson('wildsearch', isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined)
							if (wildsearchDataSet && typeof wildsearchDataSet === "object" && "WildSearch" in wildsearchDataSet) {
								setWildsearchData(wildsearchDataSet.WildSearch as IDeviceWildSearchItem[])
								searchData = wildsearchDataSet?.WildSearch as IDeviceWildSearchItem[]
							}
						} catch (error) {
							console.error('DeviceModel: failed to fetch wildsearch lib data', error);
							searchData = null;
						}
					}

				}
				const searchTextArray = []
				if (mfg) {
					searchTextArray.push(mfg)
				}
				if (eqtype) {
					searchTextArray.push(eqtype)
				}
				if (prod) {
					searchTextArray.push(prod)
				}
				searchTextArray.push(...keywordsToSearch.toLocaleLowerCase().split(' '))
				let searchResult = searchData ? wildSearch(searchData, searchTextArray as string[], andOrFlag === "AND") : []

				if (searchResult.length > 50 && mfg) {
					setShowMessage(true)

				}
				if (searchResult.length) {
					setIsLensDirty(true)
					const highestMatchScoreRecords = getHighestMatchScoreRecords(searchResult)

					if (highestMatchScoreRecords.distinctMatchScores) {
						const treeDataObject: IMatchScoreTreeGroup[] = []
						const preFixmatch: string[][] = []
						const uniquePrefixes: string[][] = [];
						const groupedData: Record<number, IDeviceWildSearchItem[]> = {};

						for (const score of highestMatchScoreRecords.distinctMatchScores) {
							const filterData = highestMatchScoreRecords.top50.filter(
								item => item.matchScore === score
							);

							groupedData[score] = filterData;

							const prefixes = [...new Set(
								filterData
									.map(item => item.mfgprefix?.trim())
									.filter((prefix): prefix is string => Boolean(prefix))
							)];

							uniquePrefixes.push(prefixes);
						}

						if (uniquePrefixes.length !== 0) {
							preFixmatch.push(...uniquePrefixes);

							if (isLocalLibRadio(selectedRadio)) {
								const flatPrefixes = uniquePrefixes.flat();
								const searchFiles = [...new Set(flatPrefixes)].map(p => `search/${p}.json`);

								try {
									const resultTree = await FnGetLibJson(
										searchFiles,
										isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/multiple` : undefined,
										undefined,
										true
									);
									if (resultTree && typeof resultTree === "object" && "files" in resultTree && resultTree?.files) {
										const JsonObjOfFile = convertFilesToJsonMap(resultTree.files as IFileObject[]);
										const fileDataTreeApiData = getCombinedSearchArray(JsonObjOfFile);

										const dataMap = new Map(
											fileDataTreeApiData.map((item) => [item.id, item])
										);

										for (const score of highestMatchScoreRecords.distinctMatchScores) {
											const filterData = groupedData[score];

											const filterDataTree: IDeviceEqTypeRecord[] = [];

											for (const element of filterData) {
												const found = dataMap.get(element.id);
												if (found) {
													filterDataTree.push(found);
												}
											}

											treeDataObject.push({ matchScore: score, apiData: filterDataTree });
										}
									}
								} catch (error) {

									console.error('DeviceModel: failed to fetch lib search files', error);
								}
							}
						}
						if (preFixmatch.length === 0) {
							setIsLensDirty(false);
							statusBarContext.setIsLoading(false)
							setConfirmMessage("No search result found !");
							setShowOkButtonOnly(true);
							setDeleteOpen(true);
							SetDisableFromWhileSearching(false)

						} else {

							if (isLocalLibRadio(selectedRadio)) {
								const finalTreeDataObject: IDeviceEqTypeRecord[] = [];

								for (let index = 0; index < treeDataObject.length; index++) {
									const element = treeDataObject[index];

									const updatedApiData = element.apiData.map((item) => ({
										...item,
										matchScore: element.matchScore,
									}));

									finalTreeDataObject.push(...updatedApiData);
								}
								makeResultTree(finalTreeDataObject, eqtype, prod, [], true)
								statusBarContext.setIsLoading(false)
								SetDisableFromWhileSearching(false)
							}
						}
					}


				} else {
					statusBarContext.setIsLoading(false)
					setConfirmMessage("No search result found !");
					setShowOkButtonOnly(true);
					setDeleteOpen(true);
					setIsLensDirty(false);
					SetDisableFromWhileSearching(false)
				}

			} else {
				makeResultTree(eqTypeApiDataRef.current, eqtype, prod, filterMfg)
				setIsLensDirty(false)
				SetDisableFromWhileSearching(false)
			}


		} catch (error) {
			console.error('DeviceModel: handleLensMouse failed', error)
			statusBarContext.setIsLoading(false)
			SetDisableFromWhileSearching(false)
		}
	}

	/* Handles manufacturer, equipment type, and product number filter changes. */
	const handleValueChangeForForm = async (value: IDeviceFormFieldValue, name: string | undefined, isDefault?: boolean | undefined) => {
		try {
			if (!isDefault) {
				setShowMessage(false)
				setIsLensDirty(false)

				let propfileData = profileString
				if (name === "Manufacturer" && value && (value !== "All" && (typeof value === 'string' || value.value !== "All"))) {
					propfileData = {}
				} else if (name === "Manufacturer" && (!value || value === "All" || (typeof value !== 'string' && value.value === "All"))) {

					setProfileString({})
					optionDataRef.current = [...optionDataRef.current, { label: "All", mty: "All", value: "All" }, { label: "All", pno: "All", value: "All" }]
				}
				if (name) {
					propfileData[name] = value
					setProfileString(propfileData)
				}

				if (name === "Manufacturer" && value) {

					// Keep manufacturer rows only; drop prior eqtype/product options
					// (product rows have pno but no mty, so filtering !mty alone left stale pnos)
					let removeEqType = optionDataRef.current.filter(
						(item) => item.mfg != null && item.mfg !== ''
					);
					let selectedMfgOption = typeof value === 'string'
						? optionDataRef.current.find((item) => item.mfg === value)
						: optionDataRef.current.find((item) => item.mfg === value.mfg);

					if (isLocalLibRadio(selectedRadio)) {
						const mfgName = getMfgNameFromFormValue(value, selectedMfgOption)
						setFilterMfg(mfgName ? [{ Manufacturer: mfgName }] : null)
					}
					let equipmentType: { Search: IDeviceEqTypeRecord[] } = { Search: [] }
					let eqids: IDeviceEqTypeRecord[] = []
					const mfgAcronym = (typeof value !== 'string' ? value.ma : undefined) ?? selectedMfgOption?.ma ?? '';

					if (isLocalLibRadio(selectedRadio)) {
						try {
							equipmentType = await FnGetLibJson(`search/${mfgAcronym}`, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as { Search: IDeviceEqTypeRecord[] } ?? { Search: [] }
						} catch (error) {

							console.error('DeviceModel: failed to fetch lib equipment type', error);
							equipmentType = { Search: [] };
						}
					}

					if (equipmentType && equipmentType.Search) {
						eqids = equipmentType.Search

						eqTypeApiDataRef.current = eqids
						setIsLensDirty(true)
					}

					const mtyAll = [{ mty: "All" }]
					eqids = eqids
						.sort((a, b) => (a.mty ?? '').localeCompare(b.mty ?? ''))
						.filter((item, index, self) => index === self.findIndex((t) => t.mty === item.mty));
					if (eqids.length === 1) {

						let productNumber = eqTypeApiDataRef.current && eqTypeApiDataRef.current.filter((item) => item.mty === eqids[0].mty)
						productNumber = productNumber && productNumber.sort((a, b) => (a.pno ?? '').localeCompare(b.pno ?? '')).filter(
							(item, index, self) =>
								index === self.findIndex((t) => t.pno === item.pno)
						);
						if (productNumber && productNumber.length === 1) {
							propfileData["Product Number"] = productNumber[0].pno;
						} else {
							propfileData["Product Number"] = "All"
						}
						let productNumberFiltered = []
						if (productNumber) {
							for (let index = 0; index < productNumber.length; index++) {
								const element = productNumber[index];
								productNumberFiltered.push({ label: element.pno, pno: element.pno, value: element.pno })
							}
						}
						let eqtypeFilter = []
						if (productNumber) {
							for (let index = 0; index < productNumber.length; index++) {
								const element = productNumber[index];
								eqtypeFilter.push({ label: element.mty, mty: element.mty, value: element.mty })
							}
						}
						propfileData["Equipment Type"] = eqids[0].mty

						const optionsDataObj = [...removeEqType, ...eqtypeFilter, ...productNumberFiltered, ...mtyAll]
						optionDataRef.current = optionsDataObj
					} else {

						const eqTypeAll = [{ mty: "All", pno: "All" }]
						propfileData["Equipment Type"] = "All";
						propfileData["Product Number"] = "All";
						let equipmentTypeFiltered = []
						for (let index = 0; index < eqids.length; index++) {
							const element = eqids[index];
							equipmentTypeFiltered.push({ label: element.mty, mty: element.mty, value: element.mty })
						}
						const optionsDataObj = [...eqTypeAll, ...removeEqType, ...equipmentTypeFiltered]
						optionDataRef.current = optionsDataObj
					}
				}
				else if (name === "Equipment Type" && value) {

					let removeProduct = optionDataRef.current.filter((item) => !item.pno)
					const eqTypeValue = typeof value === 'string' ? value : (value.mty ?? value.value ?? '');
					let productNumber = eqTypeApiDataRef.current && eqTypeApiDataRef.current.filter((item) => item.mty === eqTypeValue)
					productNumber = productNumber && productNumber.sort((a, b) => (a.pno ?? '').localeCompare(b.pno ?? '')).filter(
						(item, index, self) =>
							index === self.findIndex((t) => t.pno === item.pno)
					);
					if (productNumber) {
						if (productNumber.length === 1) {
							propfileData["Product Number"] = productNumber[0].pno;
						} else {
							propfileData["Product Number"] = "All"
						}
						const productAll = [{ pno: "All", mty: "All" }]
						let productNumberFiltered = []
						for (let index = 0; index < productNumber.length; index++) {
							const element = productNumber[index];
							productNumberFiltered.push({ label: element.pno, pno: element.pno, value: element.pno })
						}
						const optionsDataObj = [...productAll, ...removeProduct, ...productNumberFiltered]
						optionDataRef.current = optionsDataObj
						setIsLensDirty(true)
					}
				} else if (name === "Product Number" && value) {
					setIsLensDirty(true)
				}
				setProfileString({ ...propfileData })
			}
		} catch (error) {
			console.error('DeviceModel: handleValueChangeForForm failed', error)
		}
	}
	// search tabs code end


	/* Switches left-side Result tab. */
	const handleMouseEventForLeftSideTabs = (actionCode: string) => {
		setLeftSideSelectedTab(actionCode)
	}
	/* Switches right-side Search/Property tabs. */
	const handleMouseEventForRightSideTabs = (actionCode: string) => {
		setRightSideSelectedTab(actionCode)
	}


	/* Loads manufacturer dropdown options for the selected search source. */
	const GetManufacturers = async (keyword: string) => {
		optionDataRef.current = []
		let searchText: { MfgAcronym: IMfgAcronymItem[] } = { MfgAcronym: [] };
		try {

			if (DeviceModelFEnums.NetZoomDeviceLibrary === selectedRadio) {
				searchText = await FnGetLibJson(Lib.mfgacronym, isDeviceURLAvailable ? `${BASE_URL_DEVICE_MODEL}/api/files/download/single` : undefined) as { MfgAcronym: IMfgAcronymItem[] }
			}
		} catch (error) {


			console.error('DeviceModel: failed to fetch manufacturers', error);
			searchText.MfgAcronym = []
		}
		// setSerchJson(searchText.Search)
		if (searchText && searchText.MfgAcronym) {
			let Manufacturer = searchText.MfgAcronym.filter(
				(item, index, self) =>
					index === self.findIndex((t) => t.mfg === item.mfg)
			);
			// await FnExtractKeyObjects(searchText.MfgAcronym, "mfg")

			if (Manufacturer.length === 1) {
				const String = { label: Manufacturer[0].mfg, ...Manufacturer[0], value: Manufacturer[0].mfg }
				profileString["Manufacturer"] = String
				setProfileString(profileString)
				optionDataRef.current = [...Manufacturer]
				handleValueChangeForForm(String, "Manufacturer", false)
			} else {
				const AllObject = [{
					mfg: "All",
					mty: "All",
					pno: "All",
				}]
				if (keyword && keyword !== "") {
					const filteredManufacturer = Manufacturer.filter((item) => item.mfg?.toLowerCase().includes(keyword?.toLowerCase()))
					if (filteredManufacturer.length === 1) {
						const String = { label: filteredManufacturer[0].mfg, ...filteredManufacturer[0], value: filteredManufacturer[0].mfg }
						profileString["Manufacturer"] = String
						setProfileString(profileString)
						optionDataRef.current = [...filteredManufacturer]
						handleValueChangeForForm(String, "Manufacturer", false)
					} else {
						const orderMfg = filteredManufacturer.sort((a, b) => (a.mfg ?? '').localeCompare(b.mfg ?? ''));
						if (filteredManufacturer.length === 0) {
							setErrorMessage("No Manufacturer found for the given keyword. Please try again with a different keyword.")
						}
						optionDataRef.current = [...AllObject, ...orderMfg]
						setProfileString({ ...profileString })
					}
				} else {
					const orderMfg = Manufacturer.sort((a, b) => (a.mfg ?? '').localeCompare(b.mfg ?? ''));
					optionDataRef.current = [...AllObject, ...orderMfg]
					setProfileString({ ...profileString })
				}

			}
		}

	}


	/* Device MFG: wait for HEAD check so we don't fetch local then remote. */
	useEffect(() => {
		void GetManufacturers("");
	}, [selectedRadio, isDeviceURLAvailable, isDeviceUrlValidated])



	/* Expands manufacturer/eqtype nodes; product nodes have no Front/Rear view children. */
	const handleNodeExpand = async (expandedNodeKeys: Key[], info: IExpandedNodeInfo, selectedTabName: string) => {
		try {
			if (info?.node.treetype === "Product") {
				setDefaultExpandedKeysResult(expandedNodeKeys);
				return;
			}

			const nodeInfo = info.node.children.length ? info.node.children[0] : info.node
			const seletedNodeInfo: ISelectedNodeInfo = {
				event: "auto-select",
				selected: true,
				node: nodeInfo,
				selectedNodes: [nodeInfo],
			}
			handleNodeSelectTree([nodeInfo.key], seletedNodeInfo, expandedNodeKeys, selectedTabName)
		} catch (error) {
			console.error('DeviceModel: handleNodeExpand failed', error)
		}
	}

	/* Placeholder for confirm-dialog yes action (no-op). */
	function handleConfirmYesClick(): void {
	}

	/* Closes the no-results confirm dialog. */
	function handleConfirmDialogClose(): void {
		setDeleteOpen(false);
	}

	/* Starts drag from Result tree or sets inbound asset transfer data. */
	const handleDragStart = (info: NodeDragEventParams<ITreeNode>) => {
		if (info.event) {
			if (info.event.dataTransfer) {
				const data = {
					eqid: info.node.EQID,
					id: 'EQID',
				}
				info.event.dataTransfer.setData("application/json", JSON.stringify(data));

				return;
			}

		}
		// setDragItem(
		// 	{
		// 		source: "devicemodel",
		// 		node: info.node,
		// 		subSource: selectedRadio ?? DeviceModelFEnums.NetZoomDeviceLibrary,
		// 		sourceTreeData: treeDataResult,
		// 		MorePropertyData: propertyTabData
		// 	}
		// )
	}



	/* Clears drag state when tree drag ends (handled by drag context). */
	const handleDragEnd = () => {
	}

	return (
		<div className='nz-device-model' key={props.uniqueName} >
			<Splitter className='nz-device-model-splitter' >
				<SplitterPanel size={50} minSize={50} className='nz-left-side-pane' >
					<div className='nz-left-side-container'>
						{propertyTabData.length > 0 ?
							<ActionLabelTabs {...RightSideTabs} selectedTabName={rightSideSelectedTab} handleMouse={handleMouseEventForRightSideTabs} />
							: <ActionLabelTabs {...onlySearchTab} selectedTabName={rightSideSelectedTab} handleMouse={handleMouseEventForRightSideTabs} />}
						{libraryDocumentSource && <div className='nz-device-model-overlay-pane' title={libraryDocumentSource.tooltip}>
							<OverlayTab
								uniqueName={`${props.uniqueName}-device-model-source-overlay`}
								tabs={[]}
								selectedTabName=''
								tabAlignment='horizontal'
								headerText={libraryDocumentSource.label}
								hideDrager={true}
							/>
						</div>}
						<div className={`nz-tabs-output-container`}>
							<div className={`nz-search-tab ${rightSideSelectedTab === deviceModelTabs.Search ? "nz-display-block" : "nz-display-none"}`}>
								{profileString && optionDataRef.current && props.selectedNode && <SearchTab
									uniqueName="searchTab"
									optionData={optionDataRef.current}
									formControls={formControls}
									profileString={profileString}
									searchTypeValue={selectedRadio}
									errorMessage={errorMessage}
									selectedNode={props.selectedNode}
									featureId={props.featureId}
									treeData={props.treeData}
									isLensDirty={isLensDirty}
									ShowOnlyLibraryRadioB={props.ShowOnlyLibraryRadioB}
									isDisableForm={disableFromWhileSearching}
									handleValueChangeRadio={handleValueChange}
									handleLensMouse={handleLensMouse}
									searchValueChange={(value: string) => {

										setShowMessage(false)
										setErrorMessage('')
										if (value === '') {
											GetManufacturers("")
										}
										setRightSideSelectedTab(deviceModelTabs.Search)
										setSearchText(value)
									}}
									handeleValueChangeForForm={handleValueChangeForForm}
									searchText={searchText} />}
							</div>
							<div className={`nz-Property-tab ${rightSideSelectedTab === deviceModelTabs.Property ? "nz-display-block" : "nz-display-none"}`}>
								{propertyTabData && selectedTabViewName && defaultSelectedNodeInfo && (defaultSelectedNodeInfo?.node.treetype === "Product" || defaultSelectedNodeInfo?.node.treetype === "View")
									&& <PropertyTab
										uniqueName={`${props.uniqueName}-Property-tab`}
										propertyData={propertyTabData}
										views={views}
										selectedRadio={selectedRadio}
										selectedTabName={selectedTabViewName === "F" || selectedTabViewName === "Front" ? 'Front' : "Rear"} featureId={''} />

								}
							</div>
						</div>
					</div>

				</SplitterPanel>
				<SplitterPanel minSize={10}>
					<div className='nz-result-pane-container'>
						{leftSideTabsObj && treeDataResult.length > 0 && <ActionLabelTabs {...leftSideTabsObj} selectedTabName={leftSideSelectedTab} handleMouse={handleMouseEventForLeftSideTabs} />}
						<div className={`nz-tabs-output-container`}>
							{disableFromWhileSearching ?
								<div className='nz-result-pane-loading'>
									<Label uniqueName={'Loading'} label={'Loading...'} />
								</div>
								:
								<>
									<div className={`nz-search-tab ${leftSideSelectedTab === deviceModelTabs.Result ? "nz-display-block" : "nz-display-none"}`}>
										{treeDataResult && <ResultTab
											uniqueName={`${props.uniqueName}-result-tab`}
											treeData={treeDataResult}
											defaultExpandedKeys={defaultExpandedKeysResult}
											defaultSelectedKeys={defaultSelectedKeysResult}
											treeProps={treeProps}
											handleNodeSelect={(selectedKeys: Key[], info: ISelectedNodeInfo, expandedKeys: Key[]) => {
												handleNodeSelectTree(selectedKeys, info, expandedKeys, "result")
											}}
											handleNodeExpand={(expandedNodeKeys: Key[], info: IExpandedNodeInfo) => {
												handleNodeExpand(expandedNodeKeys, info, "result")
											}}
											canAllowDragDrop={canAllowTreeDrag}
											handleDragStart={handleDragStart}
											handleDragEnd={handleDragEnd}
										/>}

									</div>
									{showMessage && <div className="nz-info-result-tab">
										More than 50 records found. Please narrow your search.
									</div>}
								</>}
						</div>
					</div>
				</SplitterPanel>
			</Splitter>
			<YesNoFormContainer
				isOpen={deleteOpen}
				uniqueName={props.uniqueName}
				message={confirmMessage}
				showOkButton={showOkButtonOnly}
				handleYesButtonClick={handleConfirmYesClick}
				handleNoButtonClick={handleConfirmDialogClose}
				handleOkButtonClick={() => {
					setConfirmMessage("");
					setDeleteOpen(false);
				}}
			/>
		</div >
	)
}

export { DeviceModel };
export type { IDeviceModel, IExternalSearch };
