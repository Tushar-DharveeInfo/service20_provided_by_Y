
import './FeatureRouteContainer.css'
import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useParams } from "react-router-dom";

import { useHelpTipContext } from '../../shared/context/hooks/HelptipHooks';
import { useStatusBarContext } from '../../shared/context/hooks/StatusBarHooks';
import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks';
import { AppQARange } from '../../constants/Feature';
import { IMenuItem } from '../../shared/allinterface/menu/IMainMenu';
import { FeatureContainer } from './FeatureContainer';
import { ComponentsWrapperContainer } from '../componentswrappercontainer/ComponentsWrapperContainer';
import { FnGetLoggedInStatusMessage } from '../allcommon/FnGetLoggedInStatusMessage';

interface IFeatureRouteContainer {
    uniqueName: string;
}

const NotFoundRoute = () => {
    const { pathname } = useLocation();
    return (
        <div className="nz-feature-route-notfound">
            <span>No route found for <code>{pathname}</code></span>
        </div>
    );
};


const DynamicRouteComponent = () => {

    const location = useLocation();
    const { featureId } = useParams();
    const dynamicParams = (location.state as IMenuItem) || {};
    const [stableFeatureId, setStableFeatureId] = useState<string | undefined>(featureId);
    const [helptipString, setHelptipString] = useState<string>();
    const [StatusBarType, setStatusBarType] = useState<"menu" | "appqa" | undefined>();
    const helpTipsContext = useHelpTipContext();
    const statusBarContext = useStatusBarContext();
    const [isShowHelptip, setIsShowHelptip] = useState<boolean>(false)
    const [statusBarData, setStatusBarData] = useState<Record<string, number | string>>({});
    const mainAppContext = useMainAppContext();

    const loginStatusMessage = useMemo(
        () => FnGetLoggedInStatusMessage(
            mainAppContext.userInfoAndSubscription,
            mainAppContext.authSession
        ),
        [mainAppContext.userInfoAndSubscription, mainAppContext.authSession]
    );

    const getTipByFeatureId = (featureId: string, featureName?: string): string | undefined => {
        const target = helpTipsContext.helpTipRecords.find(item => item.featureid.startsWith(`${featureId}_`));
        return target?.tip ? target?.tip : `Helptip missing for ${featureName ?? featureId} report to SC….`;
    }

    useEffect(() => {
        if (!featureId) return;

        if (Number(featureId) < AppQARange.MAX) {
            // Do NOT change feature – keep previous
            return;
        }

        // Real navigation → update feature
        setStableFeatureId(featureId);
    }, [featureId]);

    useEffect(() => {
        if (mainAppContext && mainAppContext.apRecords) {

        }
    }, [mainAppContext])

    useEffect(() => {
        const feature = location?.state?._Feature;
        if (feature) {

            statusBarContext.clearAllStatus();
            // Keep guest / subscriber identity visible beside other status lines.
            statusBarContext.setStatusBarStringData([loginStatusMessage]);
            if (location.state.IsAppqa) {
                setStatusBarType("appqa");
            }
            else {
                setStatusBarType("menu");
            }
            setHelptipString(getTipByFeatureId(feature, location?.state?.Label));
        }
        return () => {
            setHelptipString(undefined);
            setStatusBarData({});
        }
    }, [location?.state?._Feature, loginStatusMessage])

    /* Also apply when profile arrives after the first route render. */
    useEffect(() => {
        if (!loginStatusMessage) {
            return;
        }
        statusBarContext.setStatusBarStringData([loginStatusMessage]);
    }, [loginStatusMessage]);

    const getCustomHeaderBasedOfFeatureId = (): string => {
        const selectedFeature = mainAppContext.featureRecords.find(
            (item) => item._Feature === featureId
        );

        const parentFeature = selectedFeature?.MenuID
            ? mainAppContext.featureRecords.find(
                (item) => item._Feature === selectedFeature.MenuID
            )
            : undefined;



        if (dynamicParams?.parentName) {
            return `[${dynamicParams.parentName}] ${dynamicParams.Label}`;
        }

        if (selectedFeature) {
            return parentFeature
                ? `[${parentFeature.Label}] ${selectedFeature.Label}`
                : selectedFeature.Label;
        }

        return dynamicParams?.Label ?? "";
    };

    const updateStatusBarData = (statusBarObject: string, isReplace?: boolean) => {
        if (statusBarObject.length) {
            try {
                const parsedJson = JSON.parse(statusBarObject);

                if (typeof parsedJson === "object" && parsedJson !== null) {
                    if (isReplace) {
                        setStatusBarData(parsedJson);
                    }
                    else {
                        setStatusBarData((prevData) => ({
                            ...prevData,
                            ...parsedJson,
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to parse status bar object:", error);
            }
        }
    };

    const headerText = getCustomHeaderBasedOfFeatureId();
    return (
        <ComponentsWrapperContainer
            key={location.key}
            uniqueName={'feature-wrapper'}
            featureId={featureId ?? ""}
            overlayContainer={{
                isVisible: isShowHelptip,
                x: 10, // Position from left edge
                y: 10, // Position from top edge
                width: 300, // Will be overridden by inline style
                height: 20, // Will be overridden by inline style
            }}
            helptipContainer={{
                isVisible: isShowHelptip,
                helptext: helptipString ?? "",
            }}
            statusBarContainer={{
                isVisible: true,
                StatusBarType: StatusBarType,
                statusBarData: statusBarData
            }}
            PropsComponent={{
                component: FeatureContainer,
                props: {
                    uniqueName: 'feature-container',
                    featureId: stableFeatureId ?? "",
                    appqaId: featureId && Number(featureId) < AppQARange.MAX ? featureId : undefined,
                    allowShowHeader: true,
                    headerText: headerText,
                    selectedFeatureData: dynamicParams,
                    updateStatusBarData: updateStatusBarData
                }
            }}

        />
    );
};

/*
this works like catch-all route, if no other route matches, this will be rendered
<Route path="*" element={<NotFoundRoute />} />
*/
const FeatureRouteContainer = (featureRouteContainerProps: IFeatureRouteContainer) => {
    return (
        <div key={featureRouteContainerProps.uniqueName} id="featureRouteContainer" className="nz-feature-route-container">
            <Routes>
                <Route path="/feature/:featureId"
                    element={<DynamicRouteComponent />} />
                <Route path="*" element={<NotFoundRoute />} />
            </Routes>
        </div>
    )
}

export { FeatureRouteContainer }
