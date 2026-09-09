import { useEffect, useRef, useState } from 'react'
import { Key } from 'rc-tree/lib/interface'
import { useSessionContext } from '../../shared/context/hooks/SessionHooks.ts'
import { useCommonVariableContext } from '../../shared/context/hooks/CommonVariableHooks.ts'
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks.ts'
import './FeatureContainer.css'

import { ITreeNode } from '../../shared/allinterface/tree/ITreeControl.ts'
import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu.ts'
import { ExplorerContainer } from '../explorercontainer/ExplorerContainer.tsx'
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx'
import { AppQaContainer } from './AppqaContainer.tsx'
import { FeatureRenderContainer, FeaturesWithOwnLayout } from './FeatureRenderContainer.tsx'

const ReuseDataForFeatures: string[] = [];

export interface IFeatureContainer {
    uniqueName: string;//unique identifier for the control
    featureId: string;
    allowShowHeader: boolean;
    appqaId?: string;
    headerText?: string;
    selectedFeatureData?: IMenuItem;
    updateStatusBarData?: (statusBarObject: string, isReplace?: boolean) => void;
}

const FeatureContainer = (featureContainerProps: IFeatureContainer) => {
    const [originalTreeData, setOriginalTreeData] = useState<ITreeNode[]>([]);
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [isShowOkButton, setIsShowOkButton] = useState<boolean>();
    const [showOverlay, setShowOverlay] = useState<boolean>(false);
    const [overlayPosition, setOverlayPosition] = useState<{ left: number; top: number } | null>(null);

    const allowAppQaToRender = Boolean(featureContainerProps.appqaId);
    /* Features listed in FeaturesWithOwnLayout replace the explorer content. */
    const doNotRenderExplorerTree = !allowAppQaToRender
        && FeaturesWithOwnLayout.includes(featureContainerProps.featureId);

    const mainAppContext = useMainAppContext();
    const commonVariableContext = useCommonVariableContext();
    const sessionContext = useSessionContext();

    const containerDivRef = useRef<HTMLDivElement | null>(null);
    const yesNoDialogContainerRef = useRef<HTMLDivElement | undefined>(undefined);
    const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const overlayTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            containerDivRef.current = null;
        };
    }, []);

    // Tracks last mouse position (in a ref, no re-render) so the
    // confirmation toast can be shown next to the pointer.
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            mousePositionRef.current = { x: event.clientX, y: event.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
                overlayTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const basicRoleSession = sessionContext.SessionList?.find(
            (item) => item.VariableName === "LoginUserBasicRoleName"
        );
        const newDiagnosticLevel = commonVariableContext.diagnosticLevel ?? "0";
        const newBasicRole = basicRoleSession?.SessionValue ?? "";
        if (
            commonVariableContext.sessionVarsForTreeNode?.diagnosticLevel !== newDiagnosticLevel ||
            commonVariableContext.sessionVarsForTreeNode?.basicRole !== newBasicRole
        ) {
            commonVariableContext.setSessionVarsForTreeNode?.({
                diagnosticLevel: newDiagnosticLevel,
                basicRole: newBasicRole,
            });
        }
    }, [
        sessionContext.SessionList,
        commonVariableContext.diagnosticLevel,
        commonVariableContext.sessionVarsForTreeNode?.diagnosticLevel,
        commonVariableContext.sessionVarsForTreeNode?.basicRole
    ]);

    useEffect(() => {
        const toggleDisplay = (el: Element | null, showValue = "block") => {
            if (!(el instanceof HTMLElement)) return;
            el.style.display =
                el.style.display === "none" ? showValue : "none";
        };
        const areAncestorsVisible = (el: HTMLElement): boolean => {
            let node: HTMLElement | null = el.parentElement;
            while (node) {
                const style = getComputedStyle(node);
                if (style.display === "none" || style.visibility === "hidden") {
                    return false;
                }
                node = node.parentElement;
            }
            return true;
        };
        const findDcExplorerPane = (root: HTMLElement): HTMLElement | null => {
            const dcTrees = root.querySelectorAll<HTMLElement>(".nz-dc-tree-container");
            for (const tree of dcTrees) {
                const pane = tree.closest(".p-splitter-panel") as HTMLElement | null;
                if (pane && areAncestorsVisible(pane)) {
                    return pane;
                }
            }
            const panes = root.querySelectorAll<HTMLElement>(".nz-dc-explorer-pane");
            for (const pane of panes) {
                if (areAncestorsVisible(pane)) {
                    return pane;
                }
            }
            return null;
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e?.key?.toLowerCase();
            // Ctrl + Alt + B -> toggle DC explorer pane + gutter only
            if (e.ctrlKey && e.altKey && key === "b") {
                e.preventDefault();
                e.stopPropagation();
                // First check App QA containers
                const explorerContainer =
                    document.querySelector(".nz-app-qa-setting .nz-dc-explorer-container") ||
                    document.querySelector(".nz-app-qa-entities .nz-dc-explorer-container");

                if (explorerContainer) {
                    toggleDisplay(explorerContainer, "block");
                    return;
                }
                const parent = containerDivRef.current;
                if (parent) {
                    const pane = findDcExplorerPane(parent);
                    if (!pane) {
                        return;
                    }
                    const gutter = pane.nextElementSibling;
                    toggleDisplay(pane, "block");
                    if (gutter instanceof HTMLElement && gutter.classList.contains("p-splitter-gutter")) {
                        toggleDisplay(gutter, "flex");
                    }
                }
            }
            // Ctrl + Alt + F -> toggle floor pane + gutter (scoped)
            if (e.ctrlKey && e.altKey && key === "f") {
                e.preventDefault();
                e.stopPropagation();
                const parent = containerDivRef.current?.querySelector(
                    '.nz-device-floor-layout-content'
                );
                if (parent) {
                    const floorPane = parent.querySelector('.nz-floor-layout-pane');
                    const gutter = parent.querySelector('.p-splitter-gutter');
                    toggleDisplay(floorPane, "block");
                    toggleDisplay(gutter, "flex");
                }
            }
        };
        // IMPORTANT: capture phase -> works even when tree has focus
        window.addEventListener("keydown", handleKeyDown, true);
        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, []);

    const updateOriginalTreeDataset = async (
        updatedTreedata: ITreeNode[],
        expandedKeys: Key[],
        selectedKeys: Key[],
        userTreeData: ITreeNode[] | null
    ) => {
        if (updatedTreedata.length === 0 && expandedKeys.length === 0 && selectedKeys.length === 0 && !userTreeData?.length) {
            setOriginalTreeData([]);
        } else {
            if (featureContainerProps.featureId && ReuseDataForFeatures.includes(featureContainerProps.featureId)) {
                setOriginalTreeData(updatedTreedata);
            }
        }
    };

    const handleReloadTree = (_featureId: string, _entID?: string) => {};
    const handleClearCacheTreeData = (): void => {};

    const getClassNameBasedOnFeatureId = (featureId: string) => {
        switch (featureId) {
            default:
                return `nz-feature-${featureId}`;
        }
    };

    const handleShowUserMessage = (
        messageText: string,
        container?: HTMLDivElement,
        isShowAsPrompt?: boolean
    ) => {
        if (isShowAsPrompt) {
            const { x, y } = mousePositionRef.current;
            const offset = 12;
            const estimatedWidth = 180;
            const estimatedHeight = 48;
            setOverlayPosition({
                left: Math.min(Math.max(x + offset, offset), window.innerWidth - estimatedWidth),
                top: Math.min(Math.max(y + offset, offset), window.innerHeight - estimatedHeight)
            });
            setConfirmMessage(messageText);
            setShowOverlay(true);
            if (overlayTimerRef.current) {
                clearTimeout(overlayTimerRef.current);
            }
            overlayTimerRef.current = window.setTimeout(() => {
                setShowOverlay(false);
                setOverlayPosition(null);
                overlayTimerRef.current = null;
            }, 2000);
            return;
        }

        if (container) {
            const rect = container.getBoundingClientRect();
            setOverlayPosition({ left: rect.left + 12, top: rect.top + 12 });
            setShowOverlay(true);
            window.setTimeout(() => setShowOverlay(false), 2000);
            return;
        }

        setConfirmMessage(messageText);
        setIsShowOkButton(true);
        setIsConfirmOpen(true);
        yesNoDialogContainerRef.current = container;
    };

    function handleSelectedMenuItem(selectedMenuItem: IMenuItem): void {
        void selectedMenuItem;
    }

    return (
        <div
            ref={containerDivRef}
            key={featureContainerProps.uniqueName}
            id="FeatureContainer"
            className={`nz-feature-container ${getClassNameBasedOnFeatureId(featureContainerProps.featureId)}`}
        >
            {/* Left explorer layout container */}
            <div
                style={{
                    display: allowAppQaToRender || doNotRenderExplorerTree ? 'none' : 'flex'
                }}
                className="nz-wh-100 nz-feature-content"
            >
                <ExplorerContainer
                    uniqueName={`${featureContainerProps.uniqueName}-explorer-container`}
                    featureId={featureContainerProps.featureId}
                    originalTreeData={originalTreeData}
                    allowShowHeader={true}
                    featureData={mainAppContext.featureRecords}
                    headerText={featureContainerProps.headerText}
                    clearCacheTreeData={handleClearCacheTreeData}
                    selectedFeatureData={featureContainerProps.selectedFeatureData}
                    updateOriginalTreeDataset={updateOriginalTreeDataset}
                    handleShowUserMessage={handleShowUserMessage}
                    updateStatusBarData={featureContainerProps.updateStatusBarData}
                    handleReloadTree={handleReloadTree}
                />
            </div>

            {/* Direct feature render layout container (for FeaturesWithOwnLayout) */}
            <div
                style={{
                    display: doNotRenderExplorerTree ? 'flex' : 'none'
                }}
                className="nz-wh-100 nz-feature-render-content"
            >
                <FeatureRenderContainer
                    allowFeatureToRender={doNotRenderExplorerTree}
                    doNotRenderExplorerTree={doNotRenderExplorerTree}
                    featureContainerProps={featureContainerProps}
                    handleShowUserMessage={handleShowUserMessage}
                />
            </div>

            {/* AppQA layout container */}
            <AppQaContainer
                allowAppQaToRender={allowAppQaToRender}
                featureContainerProps={featureContainerProps}
                featureRecords={mainAppContext.featureRecords}
                selectedFeatureNameForHelp={mainAppContext.selectedFeatureForHelp?.featureName ?? "Help"}
                handleSelectedMenuItem={handleSelectedMenuItem}
                handleShowUserMessage={handleShowUserMessage}
            />

            <YesNoFormContainer
                isOpen={isConfirmOpen}
                uniqueName={'appqatask-confirm'}
                message={confirmMessage}
                showOkButton={isShowOkButton}
                container={yesNoDialogContainerRef.current}
                handleYesButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }}
                handleNoButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }}
                handleOkButtonClick={() => {
                    setConfirmMessage("");
                    setIsConfirmOpen(false);
                }}
            />

            {showOverlay && (
                <div
                    className="nz-overlay-toast"
                    id="nzOverlay"
                    style={overlayPosition ? { left: overlayPosition.left, top: overlayPosition.top } : undefined}
                >
                    <div className="nz-overlay-message">
                        {confirmMessage || "Saved"}
                    </div>
                </div>
            )}
        </div>
    );
};

export { FeatureContainer };
