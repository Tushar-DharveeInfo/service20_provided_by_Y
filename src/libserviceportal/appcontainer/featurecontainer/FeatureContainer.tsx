import { useRef, useState } from 'react'
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks.ts'
import './FeatureContainer.css'

import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu.ts'
import { YesNoFormContainer } from '../../shared/basic/yesnoformcontainer/YesNoFormContainer.tsx'
import { AppQaContainer } from './AppqaContainer.tsx'
import { FeatureRenderContainer, FeaturesWithOwnLayout } from './FeatureRenderContainer.tsx'

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
    const [confirmMessage, setConfirmMessage] = useState<string>("");
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
    const [isShowOkButton, setIsShowOkButton] = useState<boolean>();
    const [showOverlay, setShowOverlay] = useState<boolean>(false);
    const [overlayPosition, setOverlayPosition] = useState<{ left: number; top: number } | null>(null);

    const yesNoDialogContainerRef = useRef<HTMLDivElement | undefined>(undefined);
    const containerDivRef = useRef<HTMLDivElement | null>(null);
    const mainAppContext = useMainAppContext();

    const allowAppQaToRender = Boolean(featureContainerProps.appqaId);
    const allowFeatureToRender = !allowAppQaToRender
        && FeaturesWithOwnLayout.includes(featureContainerProps.featureId);

    const handleShowUserMessage = (
        messageText: string,
        container?: HTMLDivElement,
        _isShowAsPrompt?: boolean
    ) => {
        setConfirmMessage(messageText);
        if (container) {
            const rect = container.getBoundingClientRect();
            setOverlayPosition({ left: rect.left + 12, top: rect.top + 12 });
            setShowOverlay(true);
            window.setTimeout(() => setShowOverlay(false), 2000);
            return;
        }
        setIsShowOkButton(true);
        setIsConfirmOpen(true);
    };

    function handleSelectedMenuItem(selectedMenuItem: IMenuItem): void {
        // Help feature name is driven by MainApp; keep callback for AppQaContainer parity.
        void selectedMenuItem;
    }

    return (
        <div
            ref={containerDivRef}
            key={featureContainerProps.uniqueName}
            id="FeatureContainer"
            className="nz-feature-container"
        >
            <div
                style={{ display: allowFeatureToRender ? 'flex' : 'none' }}
                className="nz-wh-100 nz-feature-render-content"
            >
                <FeatureRenderContainer
                    allowFeatureToRender={allowFeatureToRender}
                    featureContainerProps={featureContainerProps}
                    handleShowUserMessage={handleShowUserMessage}
                />
            </div>
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
