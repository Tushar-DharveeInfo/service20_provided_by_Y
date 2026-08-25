
import { KeyboardEvent } from 'react';
/*
 * Shared keyboard helpers for moving focus inside a container using arrow keys,
 * Home, End, and Enter. Used by sidebars, forms, filters, and other panels.
 */
// Standard HTML elements that can receive focus with Tab.

const FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

// libform (@n20a/libform) renders simple HTML controls inside `.lf-root`.
const FORM_FOCUSABLE_SELECTOR = [
    '.lf-root input:not([disabled]):not([type="hidden"])',
    '.lf-root select:not([disabled])',
    '.lf-root textarea:not([disabled])',
    '.lf-root button:not([disabled])',
    '.lf-root summary',
    '.lf-root [role="checkbox"][tabindex]:not([tabindex="-1"])',
    '.lf-root a[href]',
].join(',');

// Sidebar areas that already handle their own keyboard navigation.
const SIDEBAR_NESTED_KEYBOARD_ZONES = [
    '.nz-sidebar-strip',
    '.nz-sidebar-expandableList',
    '.nz-resize-content',
    '.nz-nav-bar',
];

/* Returns true when the element is visible on screen (not hidden by CSS). */
function isVisibleElement(element: HTMLElement): boolean {
    return element.offsetParent !== null;
}

/*
 * Same as isVisibleElement, but also checks file inputs that may be hidden
 * with CSS while still being part of the form.
 */
function isVisibleFormControl(element: HTMLElement): boolean {
    if (!isVisibleElement(element)) {
        return false;
    }
    if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'file') {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }
    return true;
}

/* Sorts elements top-to-bottom as they appear in the page. */
function sortElementsByDocumentOrder(elements: HTMLElement[]): HTMLElement[] {
    return [...elements].sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1;
        }
        if (position & Node.DOCUMENT_POSITION_PRECEDING) {
            return 1;
        }
        return 0;
    });
}

/*
 * Finds all visible focusable elements inside a container.
 * Used for general panel navigation (buttons, links, inputs, etc.).
 */
function getFocusableElements(container: HTMLElement, selector: string = FOCUSABLE_SELECTOR): HTMLElement[] {
    return sortElementsByDocumentOrder(
        Array.from(container.querySelectorAll<HTMLElement>(selector))
            .filter(isVisibleElement)
    );
}

/*
 * Finds all focusable libform fields inside a form container.
 * Also includes options from an open CheckedListBox dropdown.
 */
function getFormFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = new Set<HTMLElement>();
    container.querySelectorAll<HTMLElement>(FORM_FOCUSABLE_SELECTOR).forEach((element) => {
        if (isVisibleFormControl(element)) {
            elements.add(element);
        }
    });
    // When a CheckedListBox is open, add its visible options to the focus list.
    container.querySelectorAll<HTMLElement>('details[open] [role="listbox"] > *').forEach((option) => {
        if (!isVisibleElement(option)) {
            return;
        }
        const roleCheckbox = option.querySelector<HTMLElement>('[role="checkbox"][tabindex]:not([tabindex="-1"])');
        if (roleCheckbox && isVisibleFormControl(roleCheckbox)) {
            elements.add(roleCheckbox);
            return;
        }
        elements.add(option);
    });
    return sortElementsByDocumentOrder([...elements]);
}

/*
 * Finds which item in the focus list is currently active.
 * Checks the focused element itself and any parent in the list.
 */
function resolveActiveIndex(focusableElements: HTMLElement[]): number {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement) {
        return 0;
    }
    const directIndex = focusableElements.indexOf(activeElement);
    if (directIndex >= 0) {
        return directIndex;
    }
    const nestedIndex = focusableElements.findIndex((element) => element.contains(activeElement));
    return nestedIndex >= 0 ? nestedIndex : 0;
}

/*
 * Returns the summary element for a libform CheckedListBox,
 * or null if the element is not part of that control.
 */
function getListboxSummary(element: HTMLElement | null): HTMLElement | null {
    if (!element) {
        return null;
    }
    const summary = element.tagName === 'SUMMARY'
        ? element
        : element.closest('summary');
    if (!summary?.parentElement?.querySelector('[role="listbox"]')) {
        return null;
    }
    return summary;
}

/*
 * Finds a libform custom checkbox (span with role="checkbox")
 * on the element or on one of its parents.
 */
function getRoleCheckbox(element: HTMLElement | null): HTMLElement | null {
    if (!element) {
        return null;
    }
    if (element.getAttribute('role') === 'checkbox' && element.tabIndex >= 0) {
        return element;
    }
    return element.closest('[role="checkbox"][tabindex]:not([tabindex="-1"])');
}

/* Returns only the visible option rows inside an open listbox. */
function getVisibleListboxOptions(listbox: HTMLElement): HTMLElement[] {
    return Array.from(listbox.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && isVisibleElement(child)
    );
}

/*
 * Moves focus to one listbox option.
 * Tries checkbox, then nested input, then the option row itself.
 */
function focusListboxOption(option: HTMLElement | undefined): void {
    if (!option) {
        return;
    }
    const roleCheckbox = getRoleCheckbox(option);
    if (roleCheckbox) {
        roleCheckbox.focus();
        return;
    }
    const nestedInput = option.querySelector<HTMLInputElement>('input:not([disabled]):not([type="hidden"])');
    if (nestedInput) {
        nestedInput.focus();
        return;
    }
    option.setAttribute('tabindex', '-1');
    option.focus();
}

/* Returns the index of the currently focused listbox option, or -1 if none. */
function getActiveListboxOptionIndex(options: HTMLElement[]): number {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement) {
        return -1;
    }
    return options.findIndex((option) => option === activeElement || option.contains(activeElement));
}

/*
 * Returns true for inputs and buttons that should be clicked
 * instead of treated as plain text fields (checkbox, radio, button, etc.).
 */
function isActivatableInput(target: HTMLElement): target is HTMLInputElement | HTMLButtonElement {
    if (target.tagName === 'BUTTON') {
        return !(target as HTMLButtonElement).disabled;
    }
    if (target.tagName !== 'INPUT') {
        return false;
    }
    const input = target as HTMLInputElement;
    if (input.disabled) {
        return false;
    }
    const type = input.type.toLowerCase();
    return type === 'checkbox'
        || type === 'radio'
        || type === 'button'
        || type === 'submit'
        || type === 'reset'
        || type === 'image';
}

/*
 * Returns true for controls that toggle state on Enter or Space
 * (checkbox, radio, summary, libform role="checkbox").
 */
function isToggleControl(target: HTMLElement): boolean {
    if (target.tagName === 'SUMMARY') {
        return true;
    }
    if (target.getAttribute('role') === 'checkbox') {
        return target.getAttribute('aria-disabled') !== 'true';
    }
    return isActivatableInput(target)
        && ['checkbox', 'radio'].includes((target as HTMLInputElement).type.toLowerCase());
}

/*
 * Returns true for editable combo text fields.
 * Enter should open the dropdown, not jump to the next field.
 */
function shouldDeferEnterToLibformControl(element: HTMLElement): boolean {
    if (element.tagName !== 'INPUT' || (element as HTMLInputElement).type !== 'text') {
        return false;
    }
    const root = element.closest('.lf-root');
    return !!root?.querySelector('button[aria-label="Show options"]');
}

/*
 * Finds the control that Enter or Space should activate.
 * Checks the event target and the currently focused element.
 */
function getActivatableControl(target: HTMLElement, activeElement: HTMLElement): HTMLElement | null {
    for (const element of [target, activeElement]) {
        if (isToggleControl(element)) {
            return element;
        }
        if (isActivatableInput(element)) {
            return element;
        }
        const roleCheckbox = getRoleCheckbox(element);
        if (roleCheckbox) {
            return roleCheckbox;
        }
        const summary = getListboxSummary(element);
        if (summary) {
            return summary;
        }
    }
    return null;
}

/*
 * Clicks or toggles a control when the user presses Enter or Space.
 * libform checkboxes use a hidden input, so we click that input.
 */
function activateControl(target: HTMLElement): void {
    if (target.getAttribute('role') === 'checkbox') {
        const hiddenInput = target.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (hiddenInput) {
            hiddenInput.click();
            return;
        }
        target.click();
        return;
    }
    if (target.tagName === 'SUMMARY') {
        target.click();
        return;
    }
    if (isActivatableInput(target)) {
        target.click();
    }
}

// Returns true when left/right should move the text caret instead of changing field focus.
function isTextLikeFormField(element: HTMLElement): boolean {
    if (element.isContentEditable) {
        return true;
    }
    if (element.tagName === 'TEXTAREA') {
        const textarea = element as HTMLTextAreaElement;
        return !textarea.disabled && !textarea.readOnly;
    }
    if (element.tagName === 'INPUT') {
        const input = element as HTMLInputElement;
        if (input.disabled || input.readOnly) {
            return false;
        }
        const type = (input.type || 'text').toLowerCase();
        return type === 'text'
            || type === 'email'
            || type === 'password'
            || type === 'search'
            || type === 'url'
            || type === 'tel'
            || type === 'number';
    }
    return false;
}

/*
 * Bubble-phase handler for form containers.
 * Stops Left/Right from bubbling to parent handleContainerKeyDown after the
 * input has already moved the caret (capture handler must not block these keys).
 */
function handleFormControlsBubbleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
    }
    const target = event.target as HTMLElement;
    if (isTextLikeFormField(target)) {
        event.stopPropagation();
    }
}

/*
 * General arrow-key navigation for any container.
 * Arrow Up/Left = previous item, Arrow Down/Right = next item.
 * Home = first item, End = last item.
 *
 * Attach to a div with tabIndex={1} and onKeyDown={handleContainerKeyDown}.
 */
function handleContainerKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const container = event.currentTarget;
    const focusableElements = getFocusableElements(container);
    if (!focusableElements.length) {
        return;
    }
    const currentIndex = resolveActiveIndex(focusableElements);
    const moveFocusTo = (index: number) => {
        const bounded = Math.max(0, Math.min(index, focusableElements.length - 1));
        focusableElements[bounded]?.focus();
    };
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        moveFocusTo(currentIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        moveFocusTo(currentIndex - 1);
    } else if (event.key === 'Home') {
        event.preventDefault();
        moveFocusTo(0);
    } else if (event.key === 'End') {
        event.preventDefault();
        moveFocusTo(focusableElements.length - 1);
    }
}

/*
 * Keyboard handler for the main Sidebar container.
 *
 * The sidebar has separate zones (tab strip, submenu, form content).
 * Each zone handles its own keys. This handler only runs when focus is
 * on the sidebar root or header, so arrow keys do not jump from the
 * tab strip into form fields below.
 */
function handleSidebarKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const container = event.currentTarget;
    const target = event.target as HTMLElement;
    // Let child zones handle their own arrow keys.
    if (SIDEBAR_NESTED_KEYBOARD_ZONES.some((selector) => target.closest(selector))) {
        return;
    }
    const navigationKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!navigationKeys.includes(event.key)) {
        return;
    }
    // When focus is on the sidebar shell, move into the tab strip first.
    const stripFocusTarget = container.querySelector<HTMLElement>(
        '.nz-sidebar-strip .nz-scroll-container[tabindex]'
    );
    if (stripFocusTarget) {
        event.preventDefault();
        stripFocusTarget.focus();
        return;
    }
    // Fallback: move only between header buttons (maximize, close, etc.).
    const header = container.querySelector<HTMLElement>('.nz-sub-header');
    if (!header) {
        return;
    }
    const headerFocusables = getFocusableElements(header);
    if (!headerFocusables.length) {
        return;
    }
    const currentIndex = resolveActiveIndex(headerFocusables);
    const moveFocusTo = (index: number) => {
        const bounded = Math.max(0, Math.min(index, headerFocusables.length - 1));
        headerFocusables[bounded]?.focus();
    };
    event.preventDefault();
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        moveFocusTo(currentIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        moveFocusTo(currentIndex - 1);
    } else if (event.key === 'Home') {
        moveFocusTo(0);
    } else if (event.key === 'End') {
        moveFocusTo(headerFocusables.length - 1);
    }
}

/*
 * Handles arrow keys inside an open CheckedListBox (libform details/summary control).
 * Returns true when the key was handled so the caller can stop further processing.
 */
function handleCustomListboxNavigation(
    event: KeyboardEvent<HTMLElement>,
    target: HTMLElement,
    activeElement: HTMLElement,
    stopNavigation: () => void
): boolean {
    const summary = getListboxSummary(target) ?? getListboxSummary(activeElement);
    const listbox = (activeElement.closest('[role="listbox"]')
        ?? summary?.parentElement?.querySelector('[role="listbox"]')) as HTMLElement | null;
    if (!summary && !listbox) {
        return false;
    }
    const details = summary?.parentElement ?? null;
    const isDetailsOpen = details?.tagName === 'DETAILS' && details.hasAttribute('open');
    const options = listbox ? getVisibleListboxOptions(listbox) : [];
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        // From the closed summary row: open the list and focus the first option.
        if (summary && activeElement === summary) {
            stopNavigation();
            if (details?.tagName === 'DETAILS' && !isDetailsOpen) {
                summary.click();
            }
            if (options.length) {
                requestAnimationFrame(() => focusListboxOption(options[0]));
            }
            return true;
        }
        // Inside the open list: move to the next option.
        if (listbox && options.length) {
            const currentIndex = getActiveListboxOptionIndex(options);
            if (currentIndex >= 0 && currentIndex < options.length - 1) {
                stopNavigation();
                focusListboxOption(options[currentIndex + 1]);
                return true;
            }
        }
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        if (listbox && options.length) {
            const currentIndex = getActiveListboxOptionIndex(options);
            if (currentIndex > 0) {
                stopNavigation();
                focusListboxOption(options[currentIndex - 1]);
                return true;
            }
            // From the first option, go back to the summary row.
            if (currentIndex === 0 && summary) {
                stopNavigation();
                summary.focus();
                return true;
            }
        }
    }
    return false;
}

/*
 * Arrow and Enter navigation between libform fields in a settings form.
 *
 * Use with onKeyDownCapture on the form container so keys are caught
 * before text inputs move the text cursor.
 *
 * Form field navigation: Arrow Up/Down only (not Left/Right).
 * Enter on a toggle (checkbox, listbox summary) activates it.
 * Enter on a normal field moves to the next field.
 * Space toggles checkboxes and similar controls.
 * Left/Right are left to native control behavior (e.g. text caret).
 */
function handleFormControlsKeyDown(event: KeyboardEvent<HTMLElement>): void {

    const container = event.currentTarget;
    const focusableElements = getFormFocusableElements(container);
    if (!focusableElements.length) {
        return;
    }
    const target = event.target as HTMLElement;
    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = resolveActiveIndex(focusableElements);
    const moveFocusTo = (index: number) => {
        const bounded = Math.max(0, Math.min(index, focusableElements.length - 1));
        focusableElements[bounded]?.focus();
    };
    const stopNavigation = () => {
        event.preventDefault();
        event.stopPropagation();
    };
    // CheckedListBox has its own up/down behavior inside the open dropdown.
    if (handleCustomListboxNavigation(event, target, activeElement, stopNavigation)) {
        return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
        // Allow Shift+Enter for a new line in textarea.
        if (target.tagName === 'TEXTAREA' && event.shiftKey) {
            return;
        }
        // Let editable combo open its dropdown on Enter.
        if (shouldDeferEnterToLibformControl(activeElement)) {
            return;
        }
        const activatableControl = getActivatableControl(target, activeElement);
        if (activatableControl && (event.key === 'Enter' || isToggleControl(activatableControl))) {
            stopNavigation();
            activateControl(activatableControl);
            return;
        }
        // Enter on a text field moves focus to the next field.
        if (event.key === 'Enter') {
            stopNavigation();
            moveFocusTo(currentIndex + 1);
        }
        return;
    }
    // Let the browser handle native select dropdown with up/down and navigation keys.
    if (
        target.tagName === 'SELECT' &&
        ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
    ) {
        return;
    }
    // Let the browser handle native date/time controls with up/down and navigation keys.
    if (
        target.tagName === 'INPUT' &&
        ['date', 'time', 'datetime-local', 'month', 'week'].includes((target as HTMLInputElement).type?.toLowerCase()) &&
        ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
    ) {
        return;
    }
    if (event.key === 'ArrowDown') {
        stopNavigation();
        moveFocusTo(currentIndex + 1);
    } else if (event.key === 'ArrowUp') {
        stopNavigation();
        moveFocusTo(currentIndex - 1);
    }
}

const EXPANDABLE_MENU_NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Enter'];

/*
 * Options for expandable menu keyboard navigation (main menu + submenu).
 * ExpandableList passes menu state and callbacks; this file handles the key logic.
 */
type ExpandableMenuKeyDownOptions = {
    /* Do not handle keys when focus is inside this area (e.g. search filter). */
    ignoreInsideSelector?: string;
    mainItemCount: number;
    activeMainIndex: number | null;
    activeSubIndex: number | null;
    /* Returns the current main menu row index. */
    resolveMainIndex: () => number;
    getSubItemCount: (mainIndex: number) => number;
    hasSubMenu: (mainIndex: number) => boolean;
    isSubMenuOpen: (mainIndex: number) => boolean;
    /* Set active main index when user starts keyboard navigation. */
    onInitMainIndex: () => void;
    onMainIndexChange: (index: number) => void;
    onSubIndexChange: (index: number | null) => void;
    onOpenSubMenu: (mainIndex: number) => void;
    onCloseSubMenu: (mainIndex: number) => void;
    onSelectMain: (event: KeyboardEvent<HTMLElement>, mainIndex: number) => void;
    onSelectSub: (event: KeyboardEvent<HTMLElement>, mainIndex: number, subIndex: number) => void;
};

/* Stops the browser and parent containers from also handling this key. */
function stopMenuKeyNavigation(event: KeyboardEvent<HTMLElement>): void {
    event.preventDefault();
    event.stopPropagation();
}

/*
 * Keyboard navigation for expandable menus (ExpandableList).
 *
 * Main menu: Up/Down = move row, Right = open submenu, Left = close submenu, Enter = select.
 * Submenu: Up/Down = move row, Left = back to main menu, Enter = select.
 */
function handleExpandableMenuKeyDown(
    event: KeyboardEvent<HTMLElement>,
    options: ExpandableMenuKeyDownOptions
): void {
    const {
        ignoreInsideSelector,
        mainItemCount,
        activeMainIndex,
        activeSubIndex,
        resolveMainIndex,
        getSubItemCount,
        hasSubMenu,
        isSubMenuOpen,
        onInitMainIndex,
        onMainIndexChange,
        onSubIndexChange,
        onOpenSubMenu,
        onCloseSubMenu,
        onSelectMain,
        onSelectSub,
    } = options;

    if (mainItemCount === 0) {
        return;
    }

    const target = event.target as HTMLElement;
    if (ignoreInsideSelector && target.closest(ignoreInsideSelector)) {
        return;
    }

    if (!EXPANDABLE_MENU_NAVIGATION_KEYS.includes(event.key)) {
        return;
    }

    if (activeMainIndex === null) {
        onInitMainIndex();
    }

    const mainIndex = resolveMainIndex();

    if (activeSubIndex === null) {
        if (event.key === 'ArrowDown') {
            stopMenuKeyNavigation(event);
            onMainIndexChange((mainIndex + 1) % mainItemCount);
            onSubIndexChange(null);
            return;
        }
        if (event.key === 'ArrowUp') {
            stopMenuKeyNavigation(event);
            onMainIndexChange((mainIndex - 1 + mainItemCount) % mainItemCount);
            onSubIndexChange(null);
            return;
        }
        if (event.key === 'ArrowRight') {
            if (hasSubMenu(mainIndex)) {
                stopMenuKeyNavigation(event);
                if (!isSubMenuOpen(mainIndex)) {
                    onOpenSubMenu(mainIndex);
                }
                onSubIndexChange(0);
            }
            return;
        }
        if (event.key === 'ArrowLeft') {
            if (hasSubMenu(mainIndex) && isSubMenuOpen(mainIndex)) {
                stopMenuKeyNavigation(event);
                onCloseSubMenu(mainIndex);
            }
            return;
        }
        if (event.key === 'Enter') {
            stopMenuKeyNavigation(event);
            onSelectMain(event, mainIndex);
            return;
        }
        return;
    }

    const subItemCount = getSubItemCount(mainIndex);
    if (subItemCount === 0) {
        return;
    }

    if (event.key === 'ArrowDown') {
        stopMenuKeyNavigation(event);
        onSubIndexChange((activeSubIndex + 1) % subItemCount);
        return;
    }
    if (event.key === 'ArrowUp') {
        stopMenuKeyNavigation(event);
        onSubIndexChange((activeSubIndex - 1 + subItemCount) % subItemCount);
        return;
    }
    if (event.key === 'ArrowLeft') {
        stopMenuKeyNavigation(event);
        onCloseSubMenu(mainIndex);
        onSubIndexChange(null);
        return;
    }
    if (event.key === 'Enter') {
        stopMenuKeyNavigation(event);
        onSelectSub(event, mainIndex, activeSubIndex);
    }
}

// Areas that handle their own keyboard navigation (search/filter, grids, form fields, etc.).
const NESTED_KEYBOARD_ZONES = [
    '.nz-form-groupControl-with-filter',
    '.ag-root',
    '.log-alertlog-controls-group',
    '.nz-form-controls-container',
    '.nz-form-list-container',
];

/*
 * Container keyboard handler that skips nested zones with their own navigation.
 * Use on parents that wrap ag-grid or libalerts filters (e.g. ForensicLog, AlertLog).
 */
function handleNestedZoneContainerKeyDown(
    event: KeyboardEvent<HTMLElement>,
    nestedZones: string[] = NESTED_KEYBOARD_ZONES
): void {
    const target = event.target as HTMLElement;
    if (nestedZones.some((selector) => target.closest(selector))) {
        return;
    }
    handleContainerKeyDown(event);
}

export {
    handleContainerKeyDown,
    handleFormControlsKeyDown,
    handleFormControlsBubbleKeyDown,
    handleSidebarKeyDown,
    handleExpandableMenuKeyDown,
    handleNestedZoneContainerKeyDown,
    getFocusableElements,
};

export type { ExpandableMenuKeyDownOptions };
