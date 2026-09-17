
/** Focuses one rc-tree, clears focus from others, and marks the dual-tree host pane. */
const FnFocusRcTree = (treeOrContainer: Element | null | undefined) => {
    if (!treeOrContainer) {
        return;
    }

    const treeDiv = treeOrContainer.classList.contains("rc-tree")
        ? treeOrContainer
        : treeOrContainer.querySelector(".rc-tree");

    if (!(treeDiv instanceof HTMLElement)) {
        return;
    }

    document.querySelectorAll(".rc-tree.rc-tree-focused").forEach((el) => {
        if (el !== treeDiv) {
            el.classList.remove("rc-tree-focused");
        }
    });
    treeDiv.classList.add("rc-tree-focused");

    const host = treeDiv.closest(".nz-dual-tree-focus-host");
    if (host instanceof HTMLElement) {
        if (treeDiv.closest(".nz-feature-explorer-pane")) {
            host.dataset.activeTree = "left";
        } else if (treeDiv.closest(".nz-feature-explorer-right-pane")) {
            host.dataset.activeTree = "right";
        }
    }
};

/**
 * Only updates tree focus when the click is inside a tree control
 * (node or empty space in the tree). Clicks on layout / pane-3 keep prior state.
 */
const FnFocusRcTreeFromTreeClick = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
        return;
    }

    const treeControl = target.closest(
        [
            ".nz-tree-action-control-container",
            ".nz-tree-control-container",
            ".nz-explorer-tree-container",
            ".nz-dce-tree-container",
        ].join(", ")
    );
    if (!treeControl) {
        return;
    }

    FnFocusRcTree(treeControl);
};

export { FnFocusRcTree, FnFocusRcTreeFromTreeClick };
