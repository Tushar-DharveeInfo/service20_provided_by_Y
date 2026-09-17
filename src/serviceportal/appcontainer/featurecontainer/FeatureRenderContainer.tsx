
import { lazy, Suspense, useEffect, useState } from 'react'
import { useFirestore } from '@n20a/libfsdb';
import { getFirebaseServices } from '@n20a/libauth';

import { BuyEnums, ProfileEnums, ServicesEnums, FaqEnums, AboutEnums, PurchaseEnums } from '../../constants/Feature.ts'
import ErrorBoundary from '../../shared/errorboundary/ErrorBoundary.tsx'
import { Loader } from '../../shared/loader/Loader.tsx'

import './FeatureContainer.css'
import { IFeatureContainer } from './FeatureContainer.tsx'

import { useMainAppContext } from '../../shared/context/hooks/MainAppHooks';
// import {Reorder} from '../../features/buy/reorder/Reorder.tsx'
// import { Purchase } from '../../features/buy/purchase/Purchase.tsx'
import { Help } from '../../shared/help/Help.tsx';
import Faq from '../../features/knowledge-base/Faq.tsx';
import { ITreeNode } from '../../shared/allinterface/entity/ITreeNode.ts';

/** Shown when a feature route has no component yet. */
const FeaturePendingInfo = () => <p>Y will provide information.</p>

// const Eula = lazy(() => import('../../features/buy/eula/Eula.tsx'))
const MyProfile = lazy(() => import('../../features/profile/myprofile/MyProfile.tsx'))
const MyActivities = lazy(() => import('../../features/profile/myactivities/MyActivities.tsx'))
const MySubscriptions = lazy(() => import('../../features/profile/mysubscriptions/MySubscriptions.tsx'))

// const NetZoom = lazy(() => import('../../features/buy/netzoom/NetZoom.tsx'))
// const VisioStencils = lazy(() => import('../../features/buy/visiostencils/VisioStencils.tsx'))

const RequestVisioStencils = lazy(() => import('../../features/services/requestvisiostencils/RequestVisioStencils.tsx'))
const RequestDeviceModelsContainer = lazy(() => import('../../features/services/requestdevicemodels/RequestDeviceModels.tsx'))
const RequestSupport = lazy(() => import('../../features/services/requestsupport/RequestSupport.tsx'))

const DownloadNetZoom = lazy(() => import('../../features/services/downloadnetzoom/DownloadNetZoom.tsx'))
const TicketExplorerContainer = lazy(() => import('../../features/services/myrequests/MyRequests.tsx'))
const About = lazy(() => import('../../features/about/About.tsx'))

export interface IFeatureRenderContainer {
  allowFeatureToRender?: boolean;
  doNotRenderExplorerTree?: boolean;
  asRightPane?: boolean;
  featureContainerProps: IFeatureContainer;
  selectedNode?: ITreeNode
  treeData?: ITreeNode[];
  handleShowUserMessage: (messageText: string, container?: HTMLDivElement) => void;
}
/* Features that own the whole content area instead of the explorer tree.
   FeatureContainer reads this list to decide which side to render. */
const FeaturesWithOwnLayout: string[] = [
  ProfileEnums.MyProfile,
  ProfileEnums.MyActivities,
  ProfileEnums.MySubscriptions,
  BuyEnums.EULA,
  BuyEnums.Purchase, BuyEnums.Reorder,
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
    doNotRenderExplorerTree,
    asRightPane: _asRightPane,
    featureContainerProps,
    handleShowUserMessage,
    selectedNode: _selectedNode,
    treeData: _treeData
  } = featureRenderContainerProps;

  const mainAppContext = useMainAppContext();
  // const userInfoAndSubscription = mainAppContext?.userInfoAndSubscription;
  // const purchaseBid = userInfoAndSubscription?.userInfo.tenantNickname?.trim();
  // const purchaseCid = userInfoAndSubscription?.userInfo.username?.trim();

  // void userInfoAndSubscription;

  const shouldRender = allowFeatureToRender ?? doNotRenderExplorerTree ?? true;
  if (!shouldRender) {
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

    // case BuyEnums.Purchase:
    //   return (
    //     <ErrorBoundary>
    //       <Suspense fallback={<Loader />}>
    //         {purchaseBid && purchaseCid ? <Purchase bid={purchaseBid} cid={purchaseCid} /> : null}
    //       </Suspense>
    //     </ErrorBoundary>
    //   );

    //   case BuyEnums.Reorder:
    //   return (
    //     <ErrorBoundary>
    //       <Suspense fallback={<Loader />}>
    //         {purchaseBid && purchaseCid ? <Reorder bid={purchaseBid} /> : null}
    //       </Suspense>
    //     </ErrorBoundary>
    //   );


    // case PurchaseEnums.Cart:
    // case PurchaseEnums.Orders:
    //   return (
    //     <ErrorBoundary>
    //       <Suspense fallback={<Loader />}>
    //         <FeaturePendingInfo />
    //       </Suspense>
    //     </ErrorBoundary>
    //   );

    // case BuyEnums.EULA:
    //   return (
    //     <ErrorBoundary>
    //       <Suspense fallback={<Loader />}>
    //         <Eula />
    //       </Suspense>
    //     </ErrorBoundary>
    //   );

    // case BuyEnums.NetZoom:
    //   return (
    //     <ErrorBoundary>
    //       <Suspense fallback={<Loader />}>
    //         <NetZoom />
    //       </Suspense>
    //     </ErrorBoundary>
    //   );

    // case BuyEnums.VisioStencils:
    //   return (
    //     <ErrorBoundary>
    //       <Suspense fallback={<Loader />}>
    //         <VisioStencils />
    //       </Suspense>
    //     </ErrorBoundary>
    //   );

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

    case FaqEnums.FAQ:
      return (
        <ErrorBoundary>
          <Faq />
        </ErrorBoundary>
      );

    case AboutEnums.AboutNetZoom:
      return (
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <About />
          </Suspense>
        </ErrorBoundary>
      );

    default:
      return <FeaturePendingInfo />;
  }
}

export { FeatureRenderContainer, FeaturesWithOwnLayout }
