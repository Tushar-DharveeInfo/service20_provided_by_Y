import { lazy, Suspense } from 'react';
import { AppQA } from '../../constants/Feature.ts';
import ErrorBoundary from '../../shared/errorboundary/ErrorBoundary.tsx';
import './FeatureContainer.css'

import type { IMenuItem } from '../../shared/allinterface/menu/IMainMenu.ts'
import { IFeatureItem } from "../../shared/context/allinterface/IMainApp";
import type { IFeatureContainer } from './FeatureContainer.tsx'

import { Loader } from '../../shared/loader/Loader.tsx';
import Help from '../../features/appqa/help/Help.tsx';
import AppQaContactUs from '../../features/appqa/contectus/ContactUs.tsx';

const AppqaSignout = lazy(() => import('../../features/appqa/singout/Signout.tsx'))

interface IAppqaContainer {
    allowAppQaToRender: boolean;
    featureContainerProps: IFeatureContainer;
    featureRecords: IFeatureItem[];
    selectedFeatureNameForHelp?: string;
    handleSelectedMenuItem: (selectedMenuItem: IMenuItem) => void;
    handleShowUserMessage: (messageText: string, container?: HTMLDivElement) => void;
}

function AppQaContainer(appQaContainerProps: IAppqaContainer) {
    const {
        allowAppQaToRender,
        featureContainerProps,
        featureRecords,
        selectedFeatureNameForHelp,
        handleSelectedMenuItem,
        handleShowUserMessage
    } = appQaContainerProps;

    if (!allowAppQaToRender || !featureContainerProps.appqaId) {
        return null;
    }

    switch (featureContainerProps.appqaId) {


        case AppQA.Signout:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppqaSignout uniqueName={'app-qa-signout'} />
                    </Suspense>
                </ErrorBoundary>
            );


        case AppQA.Help:
            return (
                <ErrorBoundary>
                    <Help
                        uniqueName={'app-qa-user'}
                        headerText={featureContainerProps.headerText}
                        featureId={featureContainerProps.appqaId}
                        featureName={selectedFeatureNameForHelp ?? "Help"}
                        hideDownloadIcon={true}
                        handleShowUserMessage={handleShowUserMessage}
                    />
                </ErrorBoundary>
            );

        case AppQA.ContactUs:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<Loader />}>
                        <AppQaContactUs
                            uniqueName={'app-qa-contact-us'}
                            headerText={featureContainerProps.headerText || 'ContactUs'}
                            handleShowUserMessage={handleShowUserMessage}
                        />
                    </Suspense>
                </ErrorBoundary>
            );

        default:
            return null;
    }
}

export { AppQaContainer }
