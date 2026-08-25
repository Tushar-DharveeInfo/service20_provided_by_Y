
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './SettingsInstanceList.css';
import { IActionLabelItem } from '../../allinterface/basic/IActionLabelItem.ts';
import { IActionLabel } from '../../allinterface/basic/IActionLabel.ts';
import { BaseSettingsInstanceList } from './BaseSettingsInstanceList.tsx';
import { FilterKeywordControl } from '../../searchfilter/filterkeywordcontrol/FilterKeywordControl.tsx';

interface ISettingsInstanceList {
    uniqueName: string; // A unique name for identifying the action list
    actionLabelItems: IActionLabelItem[]; // Array of action labels for the action list
    handleSelectListItem: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string) => void; // Function to handle list item selection
    handleActionButtonClick: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode?: string, payload?: any) => void; // Function to handle Add, Edit, and Delete button clicks
    isAddMode: boolean;
    allowFilter?: boolean;
    selectedItem?: IActionLabelItem; // This will be used to set the item selected
    allowAdd?: boolean; // Optional flag to enable the Add button
    allowTestApi?: boolean; // Optional flag to enable the TestApi button
    allowPreflight?: boolean; // Optional flag to enable the Preflight button
    showEditButton?: boolean; // Optional flag to enable the Edit button
    allowDelete?: boolean; // Optional flag to enable the Delete button
    disableAdd?: boolean; // to disable action image 
    disableEdit?: boolean; // to disable action image 
    disableDelete?: boolean; // to disable action image 
    disableTestApi?: boolean; // to disable test api 
    iconSource?: string; // if provided it will show the icon 
    allowRecordLabel?: boolean;
}

const searchProps = {
    uniqueName: "filtericon",
    isShowFilterControl: true,
    lensDirty: false,
    filterDirty: false,
    searchInputValue: "",
};

const NAVIGATION_KEYS = ['ArrowUp', 'ArrowDown', 'Enter', 'Home', 'End'];

function isVisibleElement(element: HTMLElement): boolean {
    return element.offsetParent !== null;
}

function getNavigableElements(container: HTMLElement, includeFilter: boolean): HTMLElement[] {
    const elements: HTMLElement[] = [];

    if (includeFilter) {
        const filterInput = container.querySelector<HTMLElement>(
            '.nz-searchControl input:not([disabled]):not([type="hidden"])'
        );
        if (filterInput && isVisibleElement(filterInput)) {
            elements.push(filterInput);
        }
    }

    container.querySelectorAll<HTMLElement>('.nz-action-label-container').forEach((element) => {
        if (isVisibleElement(element)) {
            elements.push(element);
        }
    });

    container.querySelectorAll<HTMLElement>(
        '.nz-action-panel-actions [data-action-code]'
    ).forEach((element) => {
        if (!isVisibleElement(element) || element.querySelector('.nz-disabled')) {
            return;
        }
        elements.push(element);
    });

    return elements;
}

function resolveNavIndex(navigable: HTMLElement[]): number {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement) {
        return 0;
    }

    const directIndex = navigable.indexOf(activeElement);
    if (directIndex >= 0) {
        return directIndex;
    }

    const nestedIndex = navigable.findIndex((element) => element.contains(activeElement));
    return nestedIndex >= 0 ? nestedIndex : 0;
}

function getListItemIndex(navigable: HTMLElement[], element: HTMLElement): number {
    const listItems = navigable.filter((item) => item.classList.contains('nz-action-label-container'));
    const index = listItems.indexOf(element);
    return index >= 0 ? index : listItems.findIndex((item) => item.contains(element));
}

function getActionCodeFromButton(element: HTMLElement): string | undefined {
    return element.closest<HTMLElement>('[data-action-code]')?.dataset.actionCode
        ?? element.dataset.actionCode;
}

const SettingsInstanceList = (settingsInstanceListProps: ISettingsInstanceList) => {
    const [filterText, setFilterText] = useState<string>("");
    const [appliedFilter, setAppliedFilter] = useState<string>("");   // ← only this drives filtering
    const isAutoSelectingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Build labels fresh every render
    const actionLabels: IActionLabel[] = useMemo(() => {
        if (!settingsInstanceListProps.actionLabelItems?.length) return [];
        return settingsInstanceListProps.actionLabelItems.map((item) => {
            let isEnabled = false;
            let isPublic = false;
            let isAddEdit = false;

            if (item.profileString) {
                try {
                    const parsed = JSON.parse(item.profileString);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const p = parsed[0];
                        isEnabled = p.Enabled === true || p.Enabled === "1";
                        isPublic = p.Public === true || p.Public === "1";
                        isAddEdit = p.AddEdit === true || p.AddEdit === "1";
                    }
                } catch (error) {
                    console.log('Error in parse profile string :', error);

                }
            }

            return {
                uniqueName: `${settingsInstanceListProps.uniqueName}-${item.actionCode}`,
                label: {
                    uniqueName: `${settingsInstanceListProps.uniqueName}-label-${item.actionCode}`,
                    label: item.label,
                    tooltip: `${item.tooltip}${isAddEdit ? " (Add/Edit)" : ""}`,
                    fontWeight: isPublic ? "600" : "400",
                    fontStyle: "normal",
                    // color: "var(--textprimary)"
                    color: item.isInUse === false ? "red" : "var(--textprimary)"
                },
                w: "100%",
                h: "auto",
                actionCode: item.actionCode,
                align: "left",
                allowIcon: !!item.iconSource || isEnabled,
                isSuccess: isEnabled,
                imageTooltip: item.imageTooltip ?? (isEnabled ? "Enabled" : ""),
                showIconLast: !!item.iconSource || isEnabled,
                selected:
                    settingsInstanceListProps.selectedItem?.actionCode === item.actionCode,
                iconSource: item.iconSource,
                handleMouse: function () { }
            };
        });
    }, [settingsInstanceListProps.actionLabelItems, settingsInstanceListProps.selectedItem]);

    // Filter only when user clicks search
    const filteredActionLabels = useMemo(() => {
        if (!appliedFilter.length) return actionLabels;

        return actionLabels.filter(item =>
            item.label.label.toLowerCase().includes(appliedFilter.toLowerCase())
        );
    }, [appliedFilter, actionLabels]);

    const unusedRecordCount = useMemo(() => {
        if (!settingsInstanceListProps.allowRecordLabel) {
            return 0;
        }
        const sourceItems =
            appliedFilter.length > 0
                ? settingsInstanceListProps.actionLabelItems?.filter(item =>
                    item.label
                        .toLowerCase()
                        .includes(appliedFilter.toLowerCase())
                )
                : settingsInstanceListProps.actionLabelItems;

        return sourceItems?.filter(
            item => item.isInUse === false
        ).length ?? 0;
    }, [
        settingsInstanceListProps.actionLabelItems,
        appliedFilter
    ]);

    useEffect(() => {
        if (!isAutoSelectingRef.current) return;

        if (!filteredActionLabels.length) return;

        const first = filteredActionLabels[0];

        // Prevent infinite loop / reselecting same item
        if (settingsInstanceListProps.selectedItem?.actionCode === first.actionCode) {
            isAutoSelectingRef.current = false;
            return;
        }

        // Fake React mouse event (safe)
        const fakeEvent = {
            preventDefault: () => { },
            stopPropagation: () => { },
        } as React.MouseEvent<HTMLDivElement>;

        settingsInstanceListProps.handleSelectListItem(fakeEvent, first.actionCode);

        isAutoSelectingRef.current = false;
    }, [filteredActionLabels]);


    const searchValueChange = (value: string): void => {
        setFilterText(value);
        isAutoSelectingRef.current = true;   // clearing filter → auto select
        if (!value.length) {
            setAppliedFilter("");
        }
    };

    const handleKeywordSearchResult = (): void => {
        setAppliedFilter(filterText);   // apply filter only here
    };

    const createSyntheticMouseEvent = useCallback(
        () =>
            ({
                preventDefault: () => { },
                stopPropagation: () => { },
            }) as React.MouseEvent<HTMLDivElement>,
        []
    );

    const activateNavigableElement = useCallback(
        (element: HTMLElement, navigable: HTMLElement[]) => {
            if (element.classList.contains('nz-action-label-container')) {
                const listIndex = getListItemIndex(navigable, element);
                const item = filteredActionLabels[listIndex];
                if (item?.actionCode) {
                    settingsInstanceListProps.handleSelectListItem(createSyntheticMouseEvent(), item.actionCode);
                }
                return;
            }

            if (element.hasAttribute('data-action-code')) {
                const actionCode = getActionCodeFromButton(element);
                if (actionCode) {
                    settingsInstanceListProps.handleActionButtonClick(createSyntheticMouseEvent(), actionCode);
                }
            }
        },
        [createSyntheticMouseEvent, filteredActionLabels, settingsInstanceListProps]
    );

    const handleContainerFocus = useCallback(
        (event: React.FocusEvent<HTMLDivElement>) => {
            if (event.target !== containerRef.current || !containerRef.current) {
                return;
            }

            const navigable = getNavigableElements(
                containerRef.current,
                !!settingsInstanceListProps.allowFilter
            );
            if (!navigable.length) {
                return;
            }

            const selectedListIndex = filteredActionLabels.findIndex(
                (item) => item.actionCode === settingsInstanceListProps.selectedItem?.actionCode
            );
            const filterOffset = settingsInstanceListProps.allowFilter ? 1 : 0;
            const targetIndex = selectedListIndex >= 0
                ? selectedListIndex + filterOffset
                : filterOffset;

            navigable[Math.min(targetIndex, navigable.length - 1)]?.focus();
        },
        [
            filteredActionLabels,
            settingsInstanceListProps.allowFilter,
            settingsInstanceListProps.selectedItem,
        ]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!containerRef.current) {
                return;
            }

            const target = event.target as HTMLElement;

            if (target.closest('.nz-searchControl')) {
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                    return;
                }
                if (NAVIGATION_KEYS.includes(event.key)) {
                    return;
                }
            }

            if (!NAVIGATION_KEYS.includes(event.key)) {
                return;
            }

            if (
                event.key === 'Enter'
                && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
            ) {
                return;
            }

            const navigable = getNavigableElements(
                containerRef.current,
                !!settingsInstanceListProps.allowFilter
            );
            if (!navigable.length) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const currentIndex = resolveNavIndex(navigable);

            if (event.key === 'ArrowDown') {
                navigable[Math.min(currentIndex + 1, navigable.length - 1)]?.focus();
                return;
            }

            if (event.key === 'ArrowUp') {
                navigable[Math.max(currentIndex - 1, 0)]?.focus();
                return;
            }

            if (event.key === 'Home') {
                navigable[0]?.focus();
                return;
            }

            if (event.key === 'End') {
                navigable[navigable.length - 1]?.focus();
                return;
            }

            if (event.key === 'Enter') {
                const activeElement = navigable[currentIndex] ?? target;
                activateNavigableElement(activeElement, navigable);
            }
        },
        [activateNavigableElement, settingsInstanceListProps.allowFilter]
    );

    return (
        <div
            ref={containerRef}
            className={`nz-action-list-container${settingsInstanceListProps.allowDelete || settingsInstanceListProps.allowAdd || settingsInstanceListProps.showEditButton ? " nz-action-with-buttons" : ""}`}
            tabIndex={1}
            onFocus={handleContainerFocus}
            onKeyDownCapture={handleKeyDown}
        >
            {settingsInstanceListProps.allowFilter && (
                <FilterKeywordControl
                    {...searchProps}
                    filterDirty={filterText.length > 0 || appliedFilter.length > 0}
                    searchInputValue={filterText}
                    handleFilterMouse={handleKeywordSearchResult}
                    searchValueChange={searchValueChange}
                />
            )}

            <BaseSettingsInstanceList
                uniqueName={settingsInstanceListProps.uniqueName}
                actionLabels={filteredActionLabels}
                isAddMode={!settingsInstanceListProps.selectedItem}
                allowAdd={settingsInstanceListProps.allowAdd || false}
                showEditButton={settingsInstanceListProps.showEditButton || false}
                allowDelete={settingsInstanceListProps.allowDelete || false}
                disableAdd={settingsInstanceListProps.disableAdd || false}
                disableEdit={settingsInstanceListProps.disableEdit || false}
                disableDelete={settingsInstanceListProps.disableDelete || false}
                disableTestApi={settingsInstanceListProps.disableTestApi || false}
                allowTestApi={settingsInstanceListProps.allowTestApi ?? false}
                allowPreflight={settingsInstanceListProps.allowPreflight ?? false}
                recordLabel={filteredActionLabels.length ? `${filteredActionLabels.length}${unusedRecordCount > 0 ? ` (unused: ${unusedRecordCount})` : ""}` : ""}
                handleSelectListItem={settingsInstanceListProps.handleSelectListItem}
                handleMouseClick={settingsInstanceListProps.handleActionButtonClick}
            />
        </div>
    );
};

export { SettingsInstanceList };
export type { ISettingsInstanceList };
