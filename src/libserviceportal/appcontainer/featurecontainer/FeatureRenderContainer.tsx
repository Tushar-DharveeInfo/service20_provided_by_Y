
import { lazy, Suspense, useEffect, useState } from 'react'
import { BuyEnums, ProfileEnums, ServicesEnums, FaqEnums, AboutEnums, PurchaseEnums } from '../../constants/Feature.ts'
import ErrorBoundary from '../../shared/errorboundary/ErrorBoundary.tsx'
import { Loader } from '../../shared/loader/Loader.tsx'
// import { IFeatureRenderContainer } from '../allinterface/IFeatureRenderContainer.ts'
import './FeatureContainer.css'
import { IFeatureContainer } from './FeatureContainer.tsx'

import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks';

/** Shown when a feature route has no component yet. */
const FeaturePendingInfo = () => <p>Y will provide information.</p>


const MyProfile = lazy(() => import('../../features/profile/myprofile/MyProfile.tsx'))
const MyActivities = lazy(() => import('../../features/profile/myactivities/MyActivities.tsx'))
const MySubscriptions = lazy(() => import('../../features/profile/mysubscriptions/MySubscriptions.tsx'))


const RequestVisioStencils = lazy(() => import('../../features/services/requestvisiostencils/RequestVisioStencils.tsx'))
const RequestDeviceModelsContainer = lazy(() => import('../../features/services/requestdevicemodels/RequestDeviceModels.tsx'))
const RequestSupport = lazy(() => import('../../features/services/requestsupport/RequestSupport.tsx'))

const DownloadNetZoom = lazy(() => import('../../features/download/downloadnetzoom/DownloadNetZoom.tsx'))
const TicketExplorerContainer = lazy(() => import('../../features/services/myrequests/MyRequests.tsx'))


interface IFeatureRenderContainer {
  allowFeatureToRender: boolean;
  featureContainerProps: IFeatureContainer;
  handleShowUserMessage: (messageText: string, container?: HTMLDivElement) => void;
}
/* Features that own the whole content area instead of the explorer tree.
   FeatureContainer reads this list to decide which side to render. */
const FeaturesWithOwnLayout: string[] = [
  ProfileEnums.MyProfile,
  ProfileEnums.MyActivities,
  ProfileEnums.MySubscriptions,
  BuyEnums.EULA,
  BuyEnums.Purchase,
  BuyEnums.NetZoom,
  BuyEnums.VisioStencils,
  PurchaseEnums.Cart,
  PurchaseEnums.Orders,
  ServicesEnums.RequestSupport,
  ServicesEnums.RequestVisioStencils,
  ServicesEnums.RequestDeviceModels,
  ServicesEnums.MyRequests,
  ServicesEnums.DownloadNetZoom,
  FaqEnums.FAQ,
  AboutEnums.AboutNetZoom,
];

/* Renders feature modules dynamically based on featureId.
   Returns null if no matching feature module exists. */
function FeatureRenderContainer(featureRenderContainerProps: IFeatureRenderContainer) {
  const {
    allowFeatureToRender,
    featureContainerProps,
    handleShowUserMessage
  } = featureRenderContainerProps;
  const mainAppContext = useMainAppContext();
  const userInfoAndSubscription = mainAppContext?.userInfoAndSubscription;
  const purchaseBid = userInfoAndSubscription?.userInfo.tenantNickname?.trim();
  const purchaseCid = userInfoAndSubscription?.userInfo.username?.trim();

  if (!allowFeatureToRender) {
    return null;
  }

  switch (featureContainerProps.featureId) {

    case ProfileEnums.MyProfile:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <MyProfile
              uniqueName={'feature-profile-my-profile'}
              featureId={featureContainerProps.featureId}
              headerText={featureContainerProps.headerText}
              handleShowUserMessage={handleShowUserMessage} />
          </Suspense>
        </ErrorBoundary>
      );

    case ProfileEnums.MyActivities:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <MyActivities
              uniqueName={'feature-profile-my-activities'}
              featureId={featureContainerProps.featureId}
              headerText={featureContainerProps.headerText}
              handleShowUserMessage={handleShowUserMessage} />
          </Suspense>
        </ErrorBoundary>
      );

    case ProfileEnums.MySubscriptions:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <MySubscriptions
              uniqueName={'feature-profile-my-subscriptions'}
              featureId={featureContainerProps.featureId}
              headerText={featureContainerProps.headerText}
              handleShowUserMessage={handleShowUserMessage} />
          </Suspense>
        </ErrorBoundary>
      );

    case ServicesEnums.MyRequests:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            {/*<MyRequests />*/}
            <TicketExplorerContainer uniqueName={'request-support'} headerText={featureContainerProps.headerText ?? "Service Request"} />
          </Suspense>
        </ErrorBoundary>
      );

    case ServicesEnums.RequestSupport:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <RequestSupport
              uniqueName={'feature-request-support'}
              featureId={featureContainerProps.featureId}
              headerText={"Request Support"} />
          </Suspense>
        </ErrorBoundary>
      );

    case ServicesEnums.RequestVisioStencils:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <RequestVisioStencils />
          </Suspense>
        </ErrorBoundary>
      );

    case ServicesEnums.RequestDeviceModels:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <RequestDeviceModelsContainer formData={{ searchText: "", AndOr: "AND", Mfg: "", EqType: "", ProdNo: "", MoreInfo: "" }}
              onSearchClick={function (searchText?: string, AndOr?: 'AND' | 'OR', mfg?: string, eqtype?: string, pno?: string): void {
                throw new Error('Function not implemented.')
              }} />
          </Suspense>
        </ErrorBoundary>
      );

    case ServicesEnums.DownloadNetZoom:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <DownloadNetZoom
              uniqueName={'feature-download-netzoom'}
              featureId={featureContainerProps.featureId}
              headerText={featureContainerProps.headerText}
              handleShowUserMessage={handleShowUserMessage} />
          </Suspense>
        </ErrorBoundary>
      );

    // case FaqEnums.FAQ:
    //   return (
    //       <ErrorBoundary>
    //           {/* <Hep
    //               uniqueName={'feature-faq'}
    //               headerText={featureContainerProps.headerText}
    //               featureId={featureContainerProps.featureId}
    //               helpTitle={"Frequently Asked Questions"}
    //               pdfUrl={"/privatehelp/help-faq-service.pdf"}
    //               featureName={"FAQ"}
    //               hideDownloadIcon={true}
    //               handleShowUserMessage={handleShowUserMessage}
    //           /> */}
    //       </ErrorBoundary>
    //   );

    // case AboutEnums.AboutNetZoom:
    //   return (
    //     <ErrorBoundary>
    //       <Suspense fallback={<Loader />}>
    //         <Help
    //           uniqueName={'feature-about'}
    //           headerText={featureContainerProps.headerText}
    //           featureId={featureContainerProps.featureId}
    //           helpTitle={"About NetZoom"}
    //           pdfUrl={"/privatebrochures/about-netzoom.pdf"}
    //           featureName={"About NetZoom"}
    //           hideDownloadIcon={true}
    //           handleShowUserMessage={handleShowUserMessage}
    //         />
    //       </Suspense>
    //     </ErrorBoundary>
    //   );

    default:
      return <FeaturePendingInfo />;
  }
}

export { FeatureRenderContainer, FeaturesWithOwnLayout }
