
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IMainMenu, IMenuItem } from '../shared/allinterface/menu/IMainMenu'
import './AppContainer.css'

import { FeatureRouteContainer } from "./featurecontainer/FeatureRouteContainer"
import { TitleContainer } from "./titlecontainer/TitleContainer"
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FnGenerateUID } from '../shared/allcommon/settingsform/FnGenerateUID'
import { AppQA, FeatureMenuRange } from '../constants/Feature'
import { useSessionContext } from '../shared/context/hooks/SessionHooks'
import { ISession } from '../shared/context/allinterface/ISession'
import { FnGetSessionVariableFromStorage } from '../shared/allcommon/basic/FnGetSessionVariableFromStorage'
import { useMainAppContext } from '../shared/context/hooks/MainAppHooks'
import { IFeatureItem } from '../shared/context/allinterface/IMainApp'
import { FnUpdateFeatureLabelFromSession } from '../shared/allcommon/basic/FnUpdateFeatureLabelFromSession'
import { MainMenu } from '../shared/menu/mainmenu/MainMenu'

interface IAppContainer {
    uniqueName: string;//unique identifier for the control
    isNewSession: boolean;//indicates if this is a new session
    handleThemeChange: (theme: unknown) => void;// handler for theme change 

}

// Type guard for IMenuItem validation
const isMenuItem = (item: unknown): item is IMenuItem => {
    return (
        typeof item === "object" &&
        item !== null &&
        "_Feature" in item &&
        "Label" in item &&
        (typeof (item as IMenuItem)._Feature === "string" || typeof (item as IMenuItem)._Feature === "number") &&
        typeof (item as IMenuItem).Label === "string"
    );
};

const AppContainer = (appContainerProps: IAppContainer) => {
    const [searchParams] = useSearchParams();

    const [selectedFeatureData, setSelectedFeatureData] = useState<IMenuItem | null>(null);
    const [selectedAppQAData, setSelectedAppQAData] = useState<IMenuItem | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const navigate = useNavigate();
    const location = useLocation();
    const sessionContext = useSessionContext();
    const mainAppContext = useMainAppContext();
    const selectedFeatureIdRef = useRef<string | undefined>(undefined);

    const isManualFeatureChangeRef = useRef(false);

    const menuFeatureData: IMainMenu | null = useMemo(() => {
        if (!mainAppContext.featureRecords?.length) return null;

        return {
            uniqueName: "Menu",
            menuSize: "sm",
            w: "200px",
            h: "100%",
            isIconVertical: false,
            isVertical: false,
            compact: false,
            allowDND: true,
            featureData: [...mainAppContext.featureRecords]
        };
    }, [mainAppContext.featureRecords]);



    const callApiToUpdateSession = async (isForFeature: boolean, payload: IMenuItem) => {

    }

    const handleMenuSelect = async (
        _value: string | number | boolean | unknown,
        _actionCode?: string,
        payload?: unknown
    ): Promise<boolean> => {
        if (!isMenuItem(payload) || !payload._Feature) {
            return false;
        }
        const featureId = String(payload._Feature);

        // Prevent session redirect while manually changing feature
        isManualFeatureChangeRef.current = true;

        setSelectedFeatureData(payload);
        setSelectedAppQAData(null);

        selectedFeatureIdRef.current = featureId;

        try {
            await callApiToUpdateSession(
                true,
                payload
            );

            mainAppContext.setSelectedFeatureForHelp({
                featureID: featureId,
                featureName: payload.Label
            });
            // Navigate to newly selected feature
            navigate(
                `/feature/${featureId}`,
                {
                    state: payload
                }
            );
        } finally {
            // Keep protection until navigation/render is completed
            requestAnimationFrame(() => {
                isManualFeatureChangeRef.current = false;
            });
        }

        return true;
    };

    const handleAppqaSelect = async (
        _event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined,
        actionCode?: string,
        payload?: unknown
    ) => {
        if (selectedAppQAData && actionCode && selectedAppQAData._Feature === actionCode) {
            setSelectedAppQAData(null);
            const filteredSession = FnGetSessionVariableFromStorage("Feature", "FeatureID", sessionContext.SessionList);
            if (filteredSession && filteredSession.length > 0) {
                const featureFromSession = mainAppContext.featureRecords.find((item) => { return item._Feature === filteredSession[0].SessionValue });
                if (featureFromSession) {
                    const updatedPayload = { ...featureFromSession, IsAppqa: false };
                    setSelectedFeatureData(featureFromSession)
                    await callApiToUpdateSession(true, featureFromSession);
                    navigate(`/feature/${featureFromSession._Feature}`, { state: updatedPayload });
                    return;
                }
            }
        }
        // Validate payload
        if (!isMenuItem(payload) || !payload._Feature) {
            return;
        }

        setSelectedFeatureData(null);
        setSelectedAppQAData(payload);

        // Update help context
        if (payload._Feature !== AppQA.Help) {

            mainAppContext.setSelectedFeatureForHelp({
                featureID: String(payload._Feature),
                featureName: payload.Label
            });
        }
        await callApiToUpdateSession(false, payload);
        const updatedPayload = { ...payload, IsAppqa: true };
        navigate(`/feature/${actionCode}`, { state: updatedPayload });
    }

    const handleSelectForSubMenu = (value: any, actionCode?: string | undefined, payload?: any): void => {
        if (payload.parentName && !payload.subMenu && menuFeatureData) {
            const payloadData = { ...payload, key: FnGenerateUID() }
            if (handleMenuSelect) {
                handleMenuSelect(value, actionCode, payloadData).then(() => {
                    // setIsOpen(false)
                });
            }
        }
    }

    useEffect(() => {
        if (location.state && isMenuItem(location.state)) {
            const featureId = location.state._Feature?.toString();
            if (featureId === AppQA.Help || featureId === AppQA.ContactUs) {
                setSelectedAppQAData(location.state)
            }
            else {
                setSelectedFeatureData(location.state);
            }
        }
    }, [location?.state])

    useEffect(() => {
        return () => {
            selectedFeatureIdRef.current = undefined;
        }
    }, [])


    /*
    renders titlebar with appqa items
    render menu based on feature records where MenuID === _Feature (parent menu)
    on menu select, call handleMenuSelect with selected menu item data and close the menu on success
    
    render feature route container to display selected feature's component based on routing
    Statusbar is rendered inside feature components as needed
    */
    return (
        <div key={appContainerProps.uniqueName} id="appcontainer" className="nz-app-container" >
            {/* appcontainer */}
            <div key={`${appContainerProps.uniqueName}-ui`} id="UiContainer" className="nz-ui-container">
                <TitleContainer
                    uniqueName={`${appContainerProps.uniqueName}-ui-title`}
                    selectedAppqa={selectedAppQAData || undefined}
                    handleThemeChange={appContainerProps.handleThemeChange}
                    handleAppqaSelect={handleAppqaSelect}
                    handleMenuSelect={handleMenuSelect}
                    featureData={undefined}
                    selectedFeature={selectedFeatureData}
                    isMenuOpen={isOpen}
                    handleMenuMouse={(isOpenMenu: boolean) => {
                        setIsOpen(isOpenMenu);
                    }}
                />
                <div className="nz-ui-content">
                    <div className={`nz-action-list-menu ${isOpen ? 'nz-action-list-menu-open' : 'nz-action-list-menu-closed'}`}>
                        {menuFeatureData && (
                            <MainMenu
                                {...menuFeatureData}
                                selectedFeature={selectedFeatureData ?? undefined}
                                handleSelect={handleSelectForSubMenu}
                                // handleMouseLeave={() => { setIsOpen(false); }}
                                hideSearchControl={true}
                            />
                        )}
                    </div>
                    <FeatureRouteContainer uniqueName={`${appContainerProps.uniqueName}-ui-feature-route-container`} />
                </div>
            </div>
        </div>
    )
}
export { AppContainer }
