import React, {
    KeyboardEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from 'react';
import '../../allcss/basic/OverlayTab.css';
import { IOverlayTab } from '../../allinterface/basic/IOverlayTab';
import { ActionLabel } from '../actionlabel/ActionLabel';
import { MovePanel24x24, Setting24x24 } from '@n20a/libicon';
import { ActionImage } from '../actionimage/ActionImage';
import { FnGetIconForSubMenu } from '../../allcommon/menu/FnGetIconForSubMenu';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';

type TOverlayTabProps = IOverlayTab & {
    disableSelectionKey?: string[];
};

const getSelectedTabs = (selectedTabName?: string) => selectedTabName ? [selectedTabName] : [];

const OverlayTab = (overlayTabProps: TOverlayTabProps) => {
    const [activeTab, setActiveTab] = useState<string[]>(getSelectedTabs(overlayTabProps.selectedTabName));

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [headerOffset, setHeaderOffset] = useState(0);

    const dragStartX = useRef(0);

    const overlayRef = useRef<HTMLDivElement>(null);
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const headerTextRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Array<HTMLDivElement | null>>([]);

    /* ---------------------------
       Sync selected tab
    ---------------------------- */
    useEffect(() => {
        setActiveTab(getSelectedTabs(overlayTabProps.selectedTabName));
    }, [overlayTabProps.selectedTabName]);

    /* ---------------------------
       Header width calculation
    ---------------------------- */
    useLayoutEffect(() => {
        if (headerTextRef.current) {
            const width = headerTextRef.current.getBoundingClientRect().width;
            const offset = overlayTabProps.headerText ? width + 10 : 0;
            setHeaderOffset(offset);
            setPosition(prev => ({ ...prev, x: offset }));
        }
    }, [overlayTabProps.headerText]);

    /* ---------------------------
       Tab selection logic
    ---------------------------- */
    const handleSelect = (tab: string) => {
        let selectedTab: string[];

        if (overlayTabProps.allowMultipleSelect) {
            if (activeTab.includes(tab)) {
                selectedTab =
                    activeTab.length === 1
                        ? activeTab
                        : activeTab.filter(item => item !== tab);
            } else {
                selectedTab = [...activeTab, tab];
            }
        } else {
            selectedTab = overlayTabProps.allowUnSelect && activeTab.includes(tab)
                ? []
                : [tab];
        }

        setActiveTab(selectedTab);
        overlayTabProps.handleSelectedTab?.(selectedTab);
    };

    const isSelectionDisabled = (tabCode: string) =>
        (overlayTabProps.disableSelectionKey ?? []).some(
            (key) => key.toLowerCase() === tabCode.toLowerCase()
        );

    const handleTabAction = (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        code: string
    ) => {
        if (isSelectionDisabled(code)) {
            const tab = overlayTabProps.tabs.find((item) => item.actionCode === code);
            tab?.handleMouse(event as React.MouseEvent<HTMLDivElement>, code);
            overlayTabProps.handleSelectedTab?.([code]);
            return;
        }

        handleSelect(code);
    };

    const getSelectedTabIndex = () => {
        const selectedIndex = overlayTabProps.tabs.findIndex((tab) => activeTab.includes(tab.actionCode));
        return selectedIndex >= 0 ? selectedIndex : 0;
    };

    const focusTabAtIndex = (index: number, selectTab = !overlayTabProps.allowMultipleSelect) => {
        const tabCount = overlayTabProps.tabs.length;
        if (!tabCount) {
            return;
        }

        const boundedIndex = Math.max(0, Math.min(index, tabCount - 1));
        tabRefs.current[boundedIndex]?.focus();

        if (selectTab) {
            handleSelect(overlayTabProps.tabs[boundedIndex].actionCode);
        }
    };

    const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
        const tabCount = overlayTabProps.tabs.length;
        if (!tabCount) {
            return;
        }

        const isHorizontal = overlayTabProps.tabAlignment === 'horizontal';
        const previousKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
        const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

        if (event.key === nextKey) {
            event.preventDefault();
            focusTabAtIndex(index + 1);
            return;
        }

        if (event.key === previousKey) {
            event.preventDefault();
            focusTabAtIndex(index - 1);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            focusTabAtIndex(0);
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            focusTabAtIndex(tabCount - 1);
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleTabAction(
                event as unknown as React.MouseEvent<HTMLDivElement>,
                overlayTabProps.tabs[index].actionCode
            );
        }
    };

    const selectedTabIndex = getSelectedTabIndex();

    /* ---------------------------
       Drag start
    ---------------------------- */
    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartX.current = e.clientX - position.x;
    };

    /* ---------------------------
       Drag move (GLOBAL)
    ---------------------------- */
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (
                !isDragging ||
                !overlayRef.current ||
                !tabContainerRef.current
            )
                return;

            const containerRect = overlayRef.current.getBoundingClientRect();
            const tabRect = tabContainerRef.current.getBoundingClientRect();

            let newX = e.clientX - dragStartX.current;

            //  left boundary (after header text)
            if (newX < headerOffset) {
                newX = headerOffset;
            }

            //  right boundary
            if (newX + tabRect.width > containerRect.width) {
                newX = containerRect.width - tabRect.width;
            }

            setPosition(prev => ({ ...prev, x: newX }));
        };

        const handleMouseUp = () => setIsDragging(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, headerOffset]);

    /* ---------------------------
       Render
    ---------------------------- */
    const handleIconForMenu = (label: string) => {
        const name = label.replace(/\s*\(.*?\)/, "")

        const Icon = FnGetIconForSubMenu(name.replace(/[^0-9A-Za-z_-]/g, '') + "24x24");

        return <Icon size={FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />
    }

    const isInlineOverlay = overlayTabProps.inlineOverlay ?? false;
    const overlayWrapperClass = isInlineOverlay
        ? 'nz-overlay-inline'
        : 'nz-sub-header nz-overlay-title';

    return (
        <div
            className={overlayWrapperClass}
            style={{ position: 'relative' }}
            ref={overlayRef}
        >
            {/* Header Text */}
            {overlayTabProps.headerText
                ? <div ref={headerTextRef}>
                    {overlayTabProps.headerText}
                </div>
                : <div ref={headerTextRef} className='nz-overlay-inline-header-placeholder' />}

            {/* Draggable Tabs */}
            {!overlayTabProps.hideOvelayPanel && <div
                ref={tabContainerRef}
                className="nz-overlay-tab-draggable"
                style={{
                    position: isInlineOverlay ? 'relative' : 'absolute',
                    top: isInlineOverlay ? undefined : 0,
                    left: isInlineOverlay ? undefined : position.x,
                    flexDirection:
                        overlayTabProps.tabAlignment === 'horizontal'
                            ? 'row'
                            : 'column'
                }}
            >
                {/* Drag Handle */}
                {!overlayTabProps.hideDrager && < div
                    className="nz-drag-panel"
                    onMouseDown={onMouseDown}
                    title="Drag panel"
                >
                    <MovePanel24x24 size={16} fill="none" strokeWidth={1} />
                </div>}

                <div role="tablist" style={{ display: 'contents' }}>
                    {overlayTabProps.tabs.map((tab, index) => (
                        <div
                            key={tab.uniqueName}
                            ref={(element) => {
                                tabRefs.current[index] = element;
                            }}
                            role="tab"
                            aria-selected={activeTab.includes(tab.actionCode)}
                            tabIndex={index === selectedTabIndex ? 0 : -1}
                            className="nz-tab-container-ovelay-tab"
                            onKeyDown={(event) => handleTabKeyDown(event, index)}
                        >
                            {overlayTabProps.ShowOnlyIcon ?
                                <div

                                    className={`nz-tab-container-ovelay-tab-img ${activeTab.includes(tab.actionCode) ? 'nz-selected-icon' : ''}`}>
                                    <ActionImage
                                        uniqueName={tab.uniqueName}
                                        image={
                                            {
                                                uniqueName: `${tab.uniqueName}-image`,
                                                source: handleIconForMenu(tab.label.label),
                                                w: '18px',
                                                tooltip: "Click to " + tab.label.label,
                                                type: "svg"

                                            }}
                                        w={'18px'}
                                        actionCode={tab.actionCode}
                                        handleMouse={(e, code) =>
                                            handleTabAction(e, code ?? '')
                                        }
                                    />
                                </div>
                                :
                                <ActionLabel
                                    {...tab}
                                    selected={activeTab.includes(tab.actionCode)}

                                    handleMouse={(e, code) =>
                                        handleTabAction(e, code ?? '')
                                    }
                                />
                            }

                        </div>
                    ))}
                </div>
            </div>}
        </div >
    );
};

export { OverlayTab };
