
import { useCallback, useEffect, useMemo, useState } from 'react'
import './ViewContainer.css'
import { IView } from '../../../allinterface/deviceview/IView';
import { IImage } from '../../../../shared/allinterface/basic/IImage';
import { ITreeNode } from '../../../../shared/allinterface/entity/ITreeNode';
import { DevicePreview } from '../devicepreview/DevicePreview';
import { ITab } from '../../../allinterface/deviceview/ITab';
import { OverlayTab } from '../../../../shared/basic/overlaytab/OverlayTab';

interface IViewImageItem {
	uniqueName: string;
	label: string;
	tabName: string;
	image: IImage;
	className?: string;
}

interface IViewContainer {
	uniqueName: string; // uniqueName for the control and required
	entID?: string; // entID for the control
	views?: IView[]; // views array to show svg and title
	viewType?: "device" | "mounted";
	viewLabel?: string | undefined;
	SvgParentJSONForThreeD?: any;
	featureId?: string;
	title?: string; // title of the control;
	selectedTabName?: string; // selected Tab name;
	responsive?: boolean; // if passed true then device view will be responsive
	disableZoom?: boolean; // disable zoom in and zoom out
	deviceProps?: any; // Basic props of device 
	capacityProps?: any; // PowerThermal props of device
	tabIndex?: string;
	statusProps?: any; // Status props of device 
	selectedNode?: ITreeNode;
	selectedDeviceViewId?: string; // entid selected device
	isEncrypted?: boolean;
	hideSignalTabHeader?: boolean;
	hideChartAndAsk?: boolean;
	hideChart?: boolean;
	AvailableSvgViews?: any;
	hideTreeDView?: boolean;
	MountedRackProps?: any;
	ReckPositions?: any;
	handleSelectedTabChanges?: (selectedTabName: string, selectedTabData: any) => void;
	handleMouseDoubleClick?: (event: React.MouseEvent, actionCode?: string) => void; // selected action code 
	handleMouse?: (event: React.MouseEvent | null, actionCode?: string) => void; // selected action code 
}

const createSvgViewItem = (view: IView, svg: string, fallbackUniqueName: string): IViewImageItem => {
	const uniqueName = view?.uniqueName ? view.uniqueName : fallbackUniqueName;

	return {
		uniqueName,
		label: view.viewTitle,
		tabName: view.tab.label,
		image: {
			uniqueName,
			source: svg,
			h: "100%",
			w: "100%",
			type: "svg"
		},
		className: view.customClassName
	};
};

const ViewContainer = (props: IViewContainer) => {
	const [selectedTabName, setSelectedTabName] = useState<string>('')

	const { tabsObj, SvgImageObj, defaultSelectedTab } = useMemo(() => {
		if (!props.views?.length) {
			return {
				tabsObj: undefined as ITab[] | undefined,
				SvgImageObj: undefined as IViewImageItem[] | undefined,
				defaultSelectedTab: '',
			};
		}

		const tabs: ITab[] = []
		const deviceView: IViewImageItem[] = []
		let defaultSelectedTab = ''

		for (let index = 0; index < props.views.length; index++) {
			const element = props.views[index];
			let svg = element?.svg ? element.svg : ''

			if (props.isEncrypted) {
				svg = element.svg ? window.atob(element.svg) : ''
			}

			if (index === 0) {
				defaultSelectedTab = element.tab.label
			}

			deviceView.push(createSvgViewItem(element, svg, props.uniqueName))
			tabs.push(element.tab)
		}

		return {
			tabsObj: tabs.length > 1 ? tabs : undefined,
			SvgImageObj: deviceView,
			defaultSelectedTab,
		};
	}, [props.isEncrypted, props.uniqueName, props.views])

	useEffect(() => {
		if (!props.views?.length) return;
		setSelectedTabName(props.selectedTabName || defaultSelectedTab)
	}, [defaultSelectedTab, props.selectedTabName, props.views])

	const handleSelectedTab = useCallback((actionCode: string[]) => {
		if (actionCode?.[0]) {
			setSelectedTabName(actionCode[0])
		}
	}, [])

	const shouldRenderSvgViews = Boolean(
		SvgImageObj?.length && (selectedTabName || SvgImageObj.length === 1)
	);

	return (
		<div className='nz-two-d-view-container'>
			{props.title && <div className='nz-sub-header '>
				{tabsObj && tabsObj.length > 1 ? <OverlayTab
					uniqueName={`${props.uniqueName}-replacement-overlay`}
					tabs={tabsObj.map((t, index) => ({
						uniqueName: `${props.uniqueName}-overlay-tab-${index}`,
						label: {
							uniqueName: `${props.uniqueName}-overlay-tab-${index}-label`,
							label: t.label,
							tooltip: t.tooltip
						},
						w: "auto",
						h: "calc(var(--node_height) - var(--spacing-1))",
						actionCode: t.label,
						handleMouse: function (): void {
						}
					}))}
					ShowOnlyIcon={true}
					selectedTabName={selectedTabName ?? ""}
					tabAlignment={"horizontal"}
					headerText={props.title}
					useContainer={false}
					handleSelectedTab={handleSelectedTab}
				/> : props.title}
			</div>}

			<div className={`nz-svg-container ${SvgImageObj && SvgImageObj.length === 1 ? "nz-single-svg" : ""}`}>
				{shouldRenderSvgViews && SvgImageObj?.map((item) => (
					<div
						className={`nz-svg-device-preview ${item.tabName === selectedTabName || SvgImageObj.length === 1 ? "" : "nz-hidden"}`}
						key={item.uniqueName || item.tabName}
					>
						<DevicePreview
							{...item}
							label={props.viewLabel ?? item.label}
							allowZoom={props.disableZoom}
							handleMouse={(event) => props.handleMouse?.(event, props.entID)}
						/>
					</div>
				))}
			</div>
		</div>
	)
}

export { ViewContainer };
export type { IViewContainer, IViewImageItem };
