
interface IFeaturePermission {
    AppQAName: string;
    AppQAMenuName: string;
    AppQAFeatureName: string;
}


const FnCheckPermissionToEditName = (
    session: IFeaturePermission | string,
    isFeature?: boolean
): boolean => {

    return false
};

export { FnCheckPermissionToEditName };
export type { IFeaturePermission }