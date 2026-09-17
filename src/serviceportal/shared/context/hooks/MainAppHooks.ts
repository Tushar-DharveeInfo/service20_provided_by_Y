
import { useContext } from "react";
import { MainAppContext } from "../contextandprovider/MainApp";
import { IFeatureItem } from "../allinterface/IMainApp";

const useMainAppContext = () => {
    const context = useContext(MainAppContext);
    if (context === undefined) {
        throw new Error('useMainAppContext must be used within a MainAppProvider');
    }
    return context;
};

/* Custom hook to return feature labels for a given menuid where MenuID is different from _Feature
Note: call it at the top level of the component; since it is using another hook: useMainAppContextin it, it cannot be called inside:function or callback functions or condition or event handlers or useEffect or setTimeout or loops
*/
const useGetFeatureLabels = (menuLabel: string): string[] => {
    const mainAppContext = useMainAppContext();
    const { featureRecords } = mainAppContext;

    if (!featureRecords || !Array.isArray(featureRecords)) {
        return [];
    }

    //Find the menu feature by its Label where MenuID === _Feature (parent menu)
    const menuFeature = featureRecords.find((feature: IFeatureItem) =>
        feature.Label.toLowerCase() === menuLabel.toLowerCase() &&
        feature.MenuID === feature._Feature
    );

    if (!menuFeature || !menuFeature._Feature) {
        console.log("Yadav-menuLabel not found:", menuLabel);
        return [];
    }

    // console.log("Yadav-Found menu feature:", menuFeature);

    // Now Find all child features where MenuID matches the menu's _Feature
    return featureRecords
        .filter((feature: IFeatureItem) =>
            feature.MenuID === menuFeature._Feature &&
            feature.MenuID !== feature._Feature
        )
        .map((feature: IFeatureItem) => feature.Label);
};

/* Custom hook to return feature labels for feature records matching a given FeatureTag
Note: call it at the top level of the component; since it is using another hook: useMainAppContext in it, it cannot be called inside:function or callback functions or condition or event handlers or useEffect or setTimeout or loops
How to use?
const labels: string[] = useGetFeatureLabelsByFeatureTag("Change");

*/
const useGetFeatureLabelsByFeatureTag = (featureTag: string): string[] => {
    const mainAppContext = useMainAppContext();
    const { featureRecords } = mainAppContext;

    if (!featureRecords || !Array.isArray(featureRecords)) {
        return [];
    }

    // Filter all features matching the given FeatureTag and return their Labels
    return featureRecords
        .filter((feature: IFeatureItem) =>
            feature.FeatureTag &&
            feature.FeatureTag.toLowerCase() === featureTag.toLowerCase()
        )
        .map((feature: IFeatureItem) => feature.Label);
};

export { useMainAppContext, useGetFeatureLabels, useGetFeatureLabelsByFeatureTag };
