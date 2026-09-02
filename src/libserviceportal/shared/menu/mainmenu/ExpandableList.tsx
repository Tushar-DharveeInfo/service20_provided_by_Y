
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { isEqual } from 'lodash'
import './ExpandableList.css'
import { Up24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../allcommon/FnGetCssVariable'
import { FnGetIconForExpandableMenu } from '../../allcommon/menu/FnGetIconForExpandableMenu'
import { handleExpandableMenuKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown'

import { IMenuItem } from '../../allinterface/menu/IMainMenu'
import { Image } from '../../basic/image/Image'
import { FilterKeywordControl } from '../../searchfilter/filterkeywordcontrol/FilterKeywordControl'

interface IExpandableList {
    uniqueName: string; // uniqueName for the control and required
    menuData: IMenuItem[]; // menu data of list 
    handleMouseEvent: (event: React.MouseEvent<HTMLDivElement, MouseEvent> | undefined, actionCode: string, selectedMenu: any) => void; // handle mouse event for selected menu
    handleMouseLeave: () => void;
    selectedFeature?: IMenuItem; // selected feature item
    allowDND?: boolean; // Allow Drag and drop
    hideIcon?: boolean;
    isMenuWithAbsolute?: boolean;
    handleDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleStartDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    handleEndDrag?: (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => void;
    hideSearchControl?: boolean;
}

/* Local search UI state; handleFilterMouse and searchValueChange are wired on FilterKeywordControl at render. */
type ExpandableListSearchState = {
    uniqueName: string;
    isShowFilterControl: boolean;
    lensDirty: boolean;
    filterDirty: boolean;
    searchInputValue: string;
};

/* Drag handlers pass list props as actionCode and the dragged menu row as payload. */
type ExpandableListDragAction = string | IExpandableList;

const searchProps: ExpandableListSearchState = {
    uniqueName: "filtericon",
    isShowFilterControl: true, //show filter control.
    lensDirty: false,
    filterDirty: false,
    searchInputValue: "",
};

/* DefaultQA from feature.json is "1" / true — prefer that submenu on load / open. */
const isDefaultQaMenuItem = (item: IMenuItem): boolean =>
    item.DefaultQA === true || item.DefaultQA === 1 || item.DefaultQA === "1";

const findDefaultQaSubMenu = (
    menu: IMenuItem[]
): { parent: IMenuItem; child: IMenuItem; parentIndex: number; childIndex: number } | null => {
    for (let parentIndex = 0; parentIndex < menu.length; parentIndex++) {
        const parent = menu[parentIndex];
        const childIndex = parent.subMenu?.findIndex(isDefaultQaMenuItem) ?? -1;
        if (childIndex >= 0 && parent.subMenu) {
            return {
                parent,
                child: parent.subMenu[childIndex],
                parentIndex,
                childIndex,
            };
        }
    }
    return null;
};

const ExpandableList = (props: IExpandableList) => {
    const [mainMenu, setMainMenu] = useState<IMenuItem[] | null>(null);
    const [searchControlProps, setSearchControlProps] = useState<ExpandableListSearchState>(searchProps);
    const [originalMenuMenu, setOriginalMenuMenu] = useState<IMenuItem[] | null>(null);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedEntId, setSelectedEntId] = useState<string | undefined>();
    const [activeMainIndex, setActiveMainIndex] = useState<number | null>(null);
    const [selectedMenuIndex, setSelectedMenuIndex] = useState<number>(props.uniqueName === "Menu" ? -1 : 0);
    const [activeSubIndex, setActiveSubIndex] = useState<number | null>(null);
    const mainRefs = useRef<(HTMLDivElement | null)[]>([]);
    const subRefs = useRef<{ [key: number]: (HTMLDivElement | null)[] }>({});
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasAutoSelectedDefaultQaRef = useRef(false);

    useEffect(() => {
        if (props.menuData && props.menuData.length > 0) {
            if (!isEqual(props.menuData, originalMenuMenu)) {
                const menu: IMenuItem[] = [...props.menuData];
                const canAutoSelect =
                    props.uniqueName === "Menu" &&
                    !props.selectedFeature &&
                    !hasAutoSelectedDefaultQaRef.current;

                if (canAutoSelect) {
                    const defaultQa = findDefaultQaSubMenu(menu);
                    // Prefer DefaultQA === 1 / true submenu; else one group with one child.
                    if (defaultQa) {
                        defaultQa.parent.isOpen = true;
                        defaultQa.child.isSelected = true;
                        setSelectedEntId(defaultQa.child.EntID as string | undefined);
                        setActiveMainIndex(defaultQa.parentIndex);
                        setActiveSubIndex(defaultQa.childIndex);
                        setSelectedMenuIndex(-1);
                        hasAutoSelectedDefaultQaRef.current = true;
                        props.handleMouseEvent(undefined, "expandleList", defaultQa.child);
                    } else if (menu.length === 1 && menu[0].subMenu?.length === 1) {
                        menu[0].isOpen = true;
                        menu[0].subMenu[0].isSelected = true;
                        setSelectedEntId(menu[0].subMenu[0].EntID as string | undefined);
                        props.handleMouseEvent(undefined, "expandleList", menu[0].subMenu[0]);
                        setSelectedMenuIndex(-1);
                        menu[0].isSelected = false;
                        hasAutoSelectedDefaultQaRef.current = true;
                    }
                }

                setOriginalMenuMenu([...menu]);

                // This condition depends on searchValue
                if (!searchValue) {
                    setMainMenu([...menu]);
                }
            }
        }
    }, [props.menuData, searchValue]); // searchValue: avoid overwriting filtered mainMenu while user is searching
    useEffect(() => {
        return () => {
            setMainMenu(null);
            setOriginalMenuMenu(null);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, [])
    const handleSubListItemClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        index: number,
        item: IMenuItem) => {
        if (!mainMenu) {
            return;
        }
        try {

            setSelectedEntId(item.EntID as string | undefined);
            mainMenu.map((ele: IMenuItem) => {
                ele.isSelected = false;
                ele.subMenu?.forEach((sub: IMenuItem) => {
                    if (sub.EntID === item.EntID) {
                        sub.isSelected = true;
                        ele.isSelected = true;
                        ele.isOpen = true;
                    }
                    else {
                        sub.isSelected = false;
                    }
                })
                return ele;
            });
            setMainMenu([...mainMenu]);

            props.handleMouseEvent(event, "expandleList", item)
            setSelectedMenuIndex(-1)

            for (let mainIndex = 0; mainIndex < mainMenu.length; mainIndex++) {
                const subIndex = mainMenu[mainIndex].subMenu?.findIndex((sub) => sub.EntID === item.EntID) ?? -1;
                if (subIndex >= 0) {
                    setActiveMainIndex(mainIndex);
                    setActiveSubIndex(subIndex);
                    break;
                }
            }
        }
        catch (e) {
            console.error("Error in handleSubListItemClick:", e);
        }

    }
    const handleListItemClick = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        index: number,
        item: IMenuItem) => {
        if (!mainMenu) {
            return;
        }
        try {

            timeoutRef.current = setTimeout(() => {
                let div = document.getElementById(`nz-nav-open`)
                if (div) {
                    div?.scrollIntoView({ block: "start", behavior: 'smooth' });
                }
            }, 300);
            const subMenuLength = item.subMenu?.length ?? 0;
            const isOpeningGroup = !item.isOpen;

            // Auto-select only when this group has exactly one child.
            if (isOpeningGroup && subMenuLength === 1 && item.subMenu) {
                handleSubListItemClick(event, index, item.subMenu[0]);
                return;
            }

            const hasSubMenu = subMenuLength > 0;

            mainMenu.forEach((ele: IMenuItem) => {
                const isClickedItem =
                    (ele.EntID && item.EntID && String(ele.EntID) === String(item.EntID)) ||
                    (ele._Feature != null && item._Feature != null && String(ele._Feature) === String(item._Feature));
                const elementHasSubMenu = !!ele.subMenu?.length;

                if (isClickedItem) {
                    ele.isSelected = true;
                    if (elementHasSubMenu) {
                        ele.isOpen = ele.isOpen === undefined ? true : !ele.isOpen;
                    }
                } else {
                    ele.isSelected = false;
                    if (elementHasSubMenu) {
                        ele.isOpen = false;
                    }
                }

                if (ele.subMenu?.length) {
                    ele.subMenu.forEach((sub: IMenuItem) => {
                        if (!isClickedItem) {
                            sub.isSelected = false;
                        }
                    });
                }
            });

            setMainMenu([...mainMenu]);

            if (hasSubMenu) {
                // Parent click only expands/collapses; do not run submenu selection sync.
                setActiveMainIndex(index);
                setActiveSubIndex(null);
                setSelectedMenuIndex(index);
                props.handleMouseEvent(event, "expandleList", item);
                return;
            }

            setSelectedEntId(item.EntID as string | undefined);
            setActiveMainIndex(index);
            setActiveSubIndex(null);
            setSelectedMenuIndex(index);
            props.handleMouseEvent(event, "expandleList", item);
        } catch (error) {
            console.error("Error in handleListItemClick:", error);
        }
    }
    const searchValueChange = (value: string) => {

        if (originalMenuMenu && originalMenuMenu.length > 0 && !value) {
            const restored = originalMenuMenu.map((ele: IMenuItem) => {
                const subMenu = ele.subMenu?.map((sub: IMenuItem) => ({
                    ...sub,
                    isSelected: sub.EntID === selectedEntId,
                })) || [];

                const isAnySubSelected = subMenu.some((s: IMenuItem) => s.isSelected);
                const isSelected = ele.EntID === selectedEntId || isAnySubSelected;

                return {
                    ...ele,
                    isSelected: isSelected,
                    isOpen: isAnySubSelected,
                    subMenu: subMenu,
                };
            });

            setMainMenu([...restored]);
        }

        setSearchValue(value);
        setSearchControlProps({
            ...searchControlProps,
            searchInputValue: value,
            filterDirty: value ? true : false,
        });
    };

    /* Runs when the filter icon is clicked; applies searchValue to mainMenu (IFilterKeywordControl contract). */
    const handleKeywordSearchResult = (): void => {

        let filterData: IMenuItem[] = [];
        if (originalMenuMenu && originalMenuMenu.length > 0 && searchValue) {
            if (props.uniqueName === "Menu") {
                const filteredData = originalMenuMenu.map((element: IMenuItem) => {
                    return {
                        ...element,
                        subMenu: (element.subMenu ?? []).filter(
                            (subElement: IMenuItem) =>
                                subElement.Label?.toLowerCase().includes(searchValue?.toLowerCase()) ===
                                true ||
                                subElement.Tooltip?.toLowerCase().includes(
                                    searchValue?.toLowerCase()
                                ) === true
                        ),
                    };
                });
                filterData = filteredData.filter((element: IMenuItem) => {
                    return (
                        element.Label?.toLowerCase().includes(searchValue?.toLowerCase()) ===
                        true ||
                        element.Tooltip?.toLowerCase().includes(searchValue?.toLowerCase()) ===
                        true ||
                        // Keep parent rows when any child matched the filter above.
                        (element.subMenu?.length ?? 0) > 0
                    );
                });
                setMainMenu([...filterData]);

            } else {
                const filteredData = originalMenuMenu.map((element: IMenuItem) => {
                    return {
                        ...element,
                    };
                });
                filterData = filteredData.filter((element: IMenuItem) => {
                    return (
                        element.Label?.toLowerCase().includes(searchValue?.toLowerCase()) === true
                    );
                });
                setMainMenu([...filterData]);
            }
        } else if (
            originalMenuMenu && originalMenuMenu?.length > 0 &&
            (searchValue === "" || searchValue === null || searchValue === undefined)
        ) {
            filterData = originalMenuMenu;
            setMainMenu([...filterData]);
        }
    };
    const handleDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: ExpandableListDragAction, payload?: IMenuItem) => {
        props.handleDrag && props.handleDrag(event, actionCode, payload);
    };


    const handleEndDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: ExpandableListDragAction, payload?: IMenuItem) => {
        const clientX: number = event.clientX;
        const clientY: number = event.clientY;
        const DropDiv: HTMLElement | null = document.elementFromPoint(clientX, clientY) as HTMLElement;

        if (!DropDiv) return;

        const attrib = DropDiv.getAttribute("allow-drop");
        if (attrib) {
            props.handleEndDrag && props.handleEndDrag(event, actionCode, payload);
        }
    }

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, actionCode?: ExpandableListDragAction, payload?: IMenuItem) => {
        props.handleStartDrag && props.handleStartDrag(event, actionCode, payload)
    };

    const openMainMenuGroup = (index: number) => {
        if (!mainMenu) {
            return;
        }
        const item = mainMenu[index];
        if (!item?.subMenu?.length) {
            return;
        }

        mainMenu.forEach((ele, menuIndex) => {
            if (menuIndex === index) {
                ele.isOpen = true;
                ele.isSelected = true;
                return;
            }
            if (ele.subMenu?.length) {
                ele.isOpen = false;
            }
        });
        setMainMenu([...mainMenu]);
    };

    const closeMainMenuGroup = (index: number) => {
        if (!mainMenu) {
            return;
        }
        const item = mainMenu[index];
        if (item?.subMenu?.length && item.isOpen) {
            item.isOpen = false;
            setMainMenu([...mainMenu]);
        }
    };

    /* Find main/sub row indices for the item that is actually selected in menu data. */
    const resolveSelectionIndices = useCallback((): { mainIndex: number; subIndex: number | null } => {
        if (!mainMenu || mainMenu.length === 0) {
            return { mainIndex: 0, subIndex: null };
        }

        for (let mainIndex = 0; mainIndex < mainMenu.length; mainIndex++) {
            const subMenu = mainMenu[mainIndex].subMenu;
            if (!subMenu?.length) {
                continue;
            }
            for (let subIndex = 0; subIndex < subMenu.length; subIndex++) {
                const sub = subMenu[subIndex];
                const isSubSelected = props.uniqueName === 'Menu'
                    ? !!(
                        props.selectedFeature?._Feature
                        && sub._Feature
                        && props.selectedFeature._Feature.toString() === sub._Feature.toString()
                    )
                    : !!(sub.isSelected || (selectedEntId && sub.EntID === selectedEntId));
                if (isSubSelected) {
                    return { mainIndex, subIndex };
                }
            }
        }

        for (let mainIndex = 0; mainIndex < mainMenu.length; mainIndex++) {
            const element = mainMenu[mainIndex];
            if (element.isSelected || (selectedEntId && element.EntID === selectedEntId)) {
                return { mainIndex, subIndex: null };
            }
        }

        if (selectedMenuIndex >= 0) {
            return { mainIndex: selectedMenuIndex, subIndex: null };
        }

        return { mainIndex: 0, subIndex: null };
    }, [mainMenu, props.uniqueName, props.selectedFeature, selectedEntId, selectedMenuIndex]);

    const syncKeyboardToSelection = useCallback(() => {
        if (!mainMenu?.length) {
            return;
        }
        const { mainIndex, subIndex } = resolveSelectionIndices();
        if (
            subIndex !== null
            && mainMenu[mainIndex]?.subMenu?.length
            && !mainMenu[mainIndex]?.isOpen
        ) {
            openMainMenuGroup(mainIndex);
        }
        setActiveMainIndex(mainIndex);
        setActiveSubIndex(subIndex);
    }, [mainMenu, resolveSelectionIndices]);

    // Align keyboard focus when user selects a different menu item (click or app state).
    useEffect(() => {
        syncKeyboardToSelection();
    }, [selectedEntId, props.selectedFeature?._Feature]);

    const handleMenuContainerFocus = (event: React.FocusEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && mainMenu?.length) {
            syncKeyboardToSelection();
        }
    };

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!mainMenu || mainMenu.length === 0) {
            return;
        }

        const asMouseEvent = (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) =>
            keyboardEvent as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>;

        let navMainIndex = activeMainIndex;
        let navSubIndex = activeSubIndex;

        // First key press: start from the selected row, not index 0.
        if (navMainIndex === null) {
            const selection = resolveSelectionIndices();
            navMainIndex = selection.mainIndex;
            navSubIndex = selection.subIndex;
            setActiveMainIndex(navMainIndex);
            setActiveSubIndex(navSubIndex);
            if (
                navSubIndex !== null
                && !mainMenu[navMainIndex]?.isOpen
            ) {
                openMainMenuGroup(navMainIndex);
            }
        }

        handleExpandableMenuKeyDown(event, {
            ignoreInsideSelector: '.nz-menu-search',
            mainItemCount: mainMenu.length,
            activeMainIndex: navMainIndex,
            activeSubIndex: navSubIndex,
            resolveMainIndex: () => navMainIndex as number,
            getSubItemCount: (mainIndex) => mainMenu[mainIndex]?.subMenu?.length ?? 0,
            hasSubMenu: (mainIndex) => (mainMenu[mainIndex]?.subMenu?.length ?? 0) > 0,
            isSubMenuOpen: (mainIndex) => !!mainMenu[mainIndex]?.isOpen,
            onInitMainIndex: () => {
                const selection = resolveSelectionIndices();
                navMainIndex = selection.mainIndex;
                navSubIndex = selection.subIndex;
                setActiveMainIndex(navMainIndex);
                setActiveSubIndex(navSubIndex);
            },
            onMainIndexChange: (index) => {
                setActiveMainIndex(index);
                setActiveSubIndex(null);
            },
            onSubIndexChange: (index) => {
                setActiveSubIndex(index);
            },
            onOpenSubMenu: (mainIndex) => {
                if (!mainMenu[mainIndex]?.isOpen) {
                    openMainMenuGroup(mainIndex);
                }
            },
            onCloseSubMenu: closeMainMenuGroup,
            onSelectMain: (keyboardEvent, mainIndex) => {
                const current = mainMenu[mainIndex];
                if (current) {
                    handleListItemClick(asMouseEvent(keyboardEvent as React.KeyboardEvent<HTMLDivElement>), mainIndex, current);
                }
            },
            onSelectSub: (keyboardEvent, mainIndex, subIndex) => {
                const currentSub = mainMenu[mainIndex]?.subMenu?.[subIndex];
                if (currentSub) {
                    handleSubListItemClick(asMouseEvent(keyboardEvent as React.KeyboardEvent<HTMLDivElement>), subIndex, currentSub);
                }
            },
        });
    }, [activeMainIndex, activeSubIndex, mainMenu, resolveSelectionIndices]);

    const handleIconForMenu = (
        label: string,
    ) => {
        // Remove anything inside (...) and trim spaces
        const name = label.replace(/\s*\([^)]*\)/g, "").trim();
        const sanitizedName = name.replace(/[^0-9A-Za-z_-]/g, "");

        // If name already ends with a number, don't append 24x24
        const iconName = /\d$/.test(sanitizedName)
            ? sanitizedName
            : `${sanitizedName}`;

        const Icon = FnGetIconForExpandableMenu(iconName);

        return (
            <Icon
                size={FnGetCssVariable('--image-size-2')}
                fill="none"
                strokeWidth={1}
            />
        );
    };
    useEffect(() => {
        const id = setTimeout(() => {
            if (activeMainIndex == null) {
                return;
            }

            const focusSubItem = () => {
                subRefs.current[activeMainIndex]?.[activeSubIndex as number]?.focus();
            };

            if (activeSubIndex == null) {
                mainRefs.current[activeMainIndex]?.focus();
                return;
            }

            const mainItem = mainMenu?.[activeMainIndex];
            if (mainItem?.subMenu?.length && !mainItem.isOpen) {
                openMainMenuGroup(activeMainIndex);
                setTimeout(focusSubItem, 100);
                return;
            }

            focusSubItem();
        }, 0);
        return () => clearTimeout(id);
    }, [activeMainIndex, activeSubIndex, mainMenu]);

    return (
        <div
            className={`nz-nav-bar nz-nav-open ${props.uniqueName === "Menu" || props.isMenuWithAbsolute ? "nz-expandable-list-absolute" : ""}`}
            tabIndex={1}
            onFocus={handleMenuContainerFocus}
            onKeyDown={handleKeyDown}
        >
            {!props.hideSearchControl && searchControlProps && (
                <div className="nz-menu-search">
                    <FilterKeywordControl
                        {...searchControlProps}
                        handleFilterMouse={handleKeywordSearchResult}
                        searchValueChange={searchValueChange}
                        filterIconTooltip='Filter'
                    />
                </div>
            )}
            <Box
                className="nz-expandable-list"
                role="presentation"
                key={props.uniqueName}
                onMouseLeave={(event: React.MouseEvent<HTMLDivElement>) => {
                    if (props.handleMouseLeave) {
                        const relatedTarget = event.relatedTarget as HTMLElement;
                        // Prevent closing if focus is inside the search filter control
                        if (relatedTarget && relatedTarget?.closest &&
                            (relatedTarget.closest(".nz-menu-search") || relatedTarget.closest(".MuiInputBase-input"))

                        ) {
                            return;
                        } else {
                            event.preventDefault();
                            props.handleMouseLeave()
                        }
                    }

                }}
            >
                <List className='nz-nav-ul-main'>
                    {
                        mainMenu && mainMenu.map((element: IMenuItem, index: number) => {
                            return (
                                <Fragment key={index}>
                                    <li key={index}
                                        className='nz-nav-link' id={element.isOpen ? `nz-nav-open` : "nz-nav-close"}>
                                        {/* Menu Item */}
                                        <ListItemButton
                                            ref={(el) => {
                                                mainRefs.current[index] = el;
                                            }}
                                            tabIndex={-1}
                                            key={element.EntID + "_" + index.toString()}
                                            selected={activeSubIndex === null && activeMainIndex === index}
                                            className={`nz-nav-li-button nz-nav-li-menu  ${selectedMenuIndex === index ? ' nz-nav-li-button-selected' : ''}`}
                                            title={element.Tooltip}
                                            onClick={(event) => {
                                                handleListItemClick(event, index, element)

                                            }}>

                                            {!props.hideIcon && <ListItemIcon className='nz-nav-li-icon'>
                                                <div className="nz-feature-icon">
                                                    <Image uniqueName='menu-image' source={
                                                        handleIconForMenu(element.Alias ? element.Alias : (element.Name || element.name || element.Label || ''))}
                                                        type='svg' w='var(--image-size-2)' />

                                                </div>

                                            </ListItemIcon>}
                                            <ListItemText className={`nz-nav-menu-text ${props.hideIcon ? 'nz-only-show-label' : ""}`} primary={element.Label} style={{ opacity: 1 }} />
                                            {element.subMenu && element.subMenu.length > 0 && (<>
                                                <div
                                                    className={`nz-nav-i-arrow ${element.isOpen ? '' : 'closed'}`}
                                                >
                                                    <Image uniqueName='up-down' source={<Up24x24 size={FnGetCssVariable('--image-size-2')}
                                                        fill='none'
                                                        strokeWidth={1} />}
                                                        type='svg' w='var(--image-size-1)' />
                                                </div>

                                            </>)}
                                        </ListItemButton>
                                    </li>
                                    <Collapse key={"Clps_" + index.toString()} in={Boolean(element.isOpen)} timeout="auto" unmountOnExit>
                                        {/*submenu Items*/}
                                        <List component="div" key={"Cli_" + index.toString()} disablePadding>
                                            {element.subMenu && element.subMenu.map((subEle: IMenuItem, subIndex: number) => {

                                                return (
                                                    <li key={subIndex}
                                                        className='nz-nav-link'>
                                                        <div className='nz-image-list-data'
                                                            style={{ width: "100%", height: '100%' }}
                                                            key={props.uniqueName + index}
                                                            draggable={props.allowDND}
                                                            onDrag={(e: React.DragEvent<HTMLDivElement>) => handleDrag(e, props, subEle)}
                                                            onDragEnd={(e: React.DragEvent<HTMLDivElement>) => handleEndDrag(e, props, subEle)}
                                                            onDragStart={handleDragStart}
                                                        >
                                                            <ListItemButton
                                                                ref={(el) => {
                                                                    if (!subRefs.current[index]) subRefs.current[index] = [];
                                                                    subRefs.current[index][subIndex] = el;
                                                                }}
                                                                tabIndex={-1}
                                                                key={subEle.EntID + "_" + subIndex.toString()} sx={{ pl: 4 }}
                                                                selected={(props.uniqueName === "Menu" ? props.selectedFeature && props.selectedFeature?._Feature && props.selectedFeature._Feature.toString() === subEle._Feature?.toString() ? true : false : subEle.isSelected) || activeMainIndex === index && activeSubIndex === subIndex}
                                                                title={subEle.Tooltip}
                                                                className='nz-nav-li-button nz-nav-sub-menu'
                                                                onClick={(event) => handleSubListItemClick(event, subIndex, subEle)}>
                                                                {!props.hideIcon && <ListItemIcon className='nz-nav-li-icon'>
                                                                    <Image uniqueName='menu-image' source={handleIconForMenu(subEle.Alias ? subEle.Alias : (subEle.Name || subEle.name || subEle.Label || ''))}
                                                                        type='svg' w='var(--image-size-2)' />
                                                                </ListItemIcon>}
                                                                <ListItemText primary={subEle.Label} className='nz-nav-sub-menu-text' />
                                                            </ListItemButton>
                                                        </div>
                                                        {subEle.NodeType && subEle.NodeType?.toLowerCase().includes('separator') &&
                                                            <hr className='nz-image-list-separator' />
                                                        }
                                                    </li>)

                                            })}
                                        </List>
                                    </Collapse>
                                    {element.separator && <hr className='nz-image-list-separator' />}
                                </Fragment>)
                        })
                    }
                </List>
            </Box>
        </div>
    )
}
export { ExpandableList };
export type { IExpandableList };

