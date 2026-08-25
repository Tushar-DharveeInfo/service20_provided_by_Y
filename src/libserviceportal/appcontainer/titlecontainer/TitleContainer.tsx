
import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { Burger24x24 } from "@n20a/libicon"
import './TitleContainer.css'
import { useMainAppContext } from "../../shared/context/hooks/MainAppHooks"
import { FnGetCssVariable } from "../allcommon/FnGetCssVariable"
import { IMenuImage } from "../../shared/allinterface/menu/IMenuImage"
import { IMenuItem } from "../../shared/allinterface/menu/IMainMenu"

import { AppQA } from "../../constants/Feature"
import { MenuImage } from "../../shared/menu/menuimage/MenuImage"
import { AppQaMenuContainer } from "./appqamenucontainer/AppQaMenuContainer"

interface ITitleContainer {
    uniqueName: string;//unique identifier for the control
    handleThemeChange: (theme: unknown) => void;// handler for theme change 
    selectedAppqa?: IMenuItem;//selected appqa
    handleAppqaSelect?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any) => void;//handle appqa selected
    handleMenuSelect: (value: string | number | boolean | unknown, actionCode?: string, payload?: IMenuItem | unknown) => void;
    featureData?: IMenuItem[];
    selectedFeature: IMenuItem | null;
    isMenuOpen?: boolean;
    handleMenuMouse?: (isOpen: boolean) => void;
}

const TitleContainer = (titleContainerProps: ITitleContainer) => {
    const [appqaData, setAppqaData] = useState<{ Menu: IMenuItem[], subMenu: IMenuItem[] }>();
    const [isOpenMenuIcon, setIsOpenMenuIcon] = useState<boolean>(true);
    const [menuImageClick, setMenuImageClick] = useState<boolean>(false);  //set false to keep menu open
    const [licenseeLogoTooltip, setLicenseeLogoTooltip] = useState<string>("NetZoom Inc.");
    const [menuImageObject, setMenuImageObject] = useState<IMenuImage>();
    const mainAppContext = useMainAppContext();
    const navigate = useNavigate();

    const isMenuOpenByDefault = titleContainerProps.isMenuOpen ?? true;
    const menuImage: IMenuImage = {
        uniqueName: titleContainerProps.uniqueName + 'menuImage', //Unique name for the control and required
        image: {
            //Below titleContainerProps are of image component
            uniqueName: titleContainerProps.uniqueName + 'image',
            source: <Burger24x24
                size={FnGetCssVariable('--image-size-2')}
                fill='none'
                strokeWidth={1} />,
            w: '30px',
            h: '30px',
            tooltip: isMenuOpenByDefault ? "Click to hide menus" : "Click to view menus",
            type: "svg",
        },
        w: 40, //Width of the burger image container
        h: 40, //Height of the burger image container if not provided it will take h=w
        border: "none", //if provided it will overwrite the border css
        // Match AppContainer isOpen default so burger starts yellow/rotated when menu is open.
        active: isMenuOpenByDefault,
        activeBGColor: "#FFFF99", //it will show the background color if provided. value can be "black","#a12345","rgb(255,255,255)"
        allowAnimations: true,
    };
    useEffect(() => {
        setMenuImageObject(menuImage)
        setIsOpenMenuIcon(isMenuOpenByDefault)
        setMenuImageClick(isMenuOpenByDefault)
    }, [])

    useEffect(() => {
        setMenuImageObject((prev) => ({
            ...(prev ?? menuImage),
            active: titleContainerProps.isMenuOpen,
            image: {
                ...(prev?.image ?? menuImage.image),
                tooltip: titleContainerProps.isMenuOpen ? "Click to hide menus" : "Click to view menus"
            }
        } as IMenuImage));
        setIsOpenMenuIcon(titleContainerProps.isMenuOpen ?? false)
        if (titleContainerProps.isMenuOpen === false) {
            setMenuImageClick(false)
        }
    }, [titleContainerProps.isMenuOpen])





    useEffect(() => {
        if (mainAppContext.featureRecords.length > 0) {
            const filteredAppqa = mainAppContext.featureRecords.filter((item) => { return ((item._Feature as unknown as number) > 40 && (item._Feature as unknown as number) < 50) || ((item._Feature as unknown as number) > 90 && (item._Feature as unknown as number) < 100) });
            if (filteredAppqa.length > 0) {
                const appqaMenu: IMenuItem[] = []
                const appqaSubMenu: IMenuItem[] = []
                filteredAppqa.sort((a, b) => b.SortOrder - a.SortOrder);
                filteredAppqa.forEach((element) => {
                    if ((element._Feature as unknown as number) > 50 && (element._Feature as unknown as number) < 100) {
                        appqaSubMenu.push(element)
                    } else {
                        appqaMenu.push(element)
                    }
                })

                const menu = appqaSubMenu.sort((a, b) => a.SortOrder - b.SortOrder);

                setAppqaData({ Menu: appqaMenu, subMenu: menu });
            }
            else {
                setAppqaData({ Menu: [], subMenu: [] });
            }
        }
    }, [mainAppContext.featureRecords, titleContainerProps.selectedFeature])



    // Route App QA menu actions to theme, navigation, or parent handler.
    const handleAppqaChange = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any) => {
        if (actionCode === "theme") {
            titleContainerProps.handleThemeChange(payload);
        }
        else if (actionCode === AppQA.Launch || actionCode === AppQA.Signout) {
            const updatedPayload = { ...payload, IsAppqa: true };
            navigate(`/feature/${actionCode}`, { state: updatedPayload });
        }

        else {
            if (titleContainerProps.handleAppqaSelect) {
                titleContainerProps.handleAppqaSelect(event, actionCode, payload)
            }
            else {
                const updatedPayload = { ...payload, IsAppqa: true };
                navigate(`/feature/${actionCode}`, { state: updatedPayload });
            }
        }
    }

    // Toggle main menu open state when burger icon is clicked or hovered.
    const handleMouse = (event: any, actionCode: string) => {
        if (event && event.type === "click") {
            setMenuImageClick(true)
        }
        if (event && event.type === "mouseenter" && menuImageClick) {
            return null
        }
        setMenuImageObject({ ...menuImageObject, active: !isOpenMenuIcon, image: { ...menuImage.image, tooltip: isOpenMenuIcon ? "Click to view menus" : "Click to hide menus" } } as IMenuImage);
        setIsOpenMenuIcon(!isOpenMenuIcon);
        titleContainerProps.handleMenuMouse && titleContainerProps.handleMenuMouse(!isOpenMenuIcon);
    }

    return (
        <div key={titleContainerProps.uniqueName} id="TitleContainer" className="nz-title-container" tabIndex={1}>

            {menuImageObject && <MenuImage {...menuImageObject}
                handleMouse={handleMouse}
                // handleMouseEnter={!menuImageClick ? handleMouse : undefined} //uncomment if you want to allow hover to open menu when menuImageClick is false

            />}
            {appqaData && <AppQaMenuContainer
                uniqueName="appqa-menu-container"
                appqaData={appqaData}
                logoImageTooltip={licenseeLogoTooltip}
                selectedFeature={titleContainerProps.selectedAppqa
                    ? titleContainerProps.selectedAppqa
                    : ((titleContainerProps.selectedFeature &&
                        titleContainerProps.selectedFeature._Feature &&
                        (Object.values(AppQA) as string[]).includes(titleContainerProps.selectedFeature._Feature as string))
                        ? titleContainerProps.selectedFeature
                        : undefined)}
                handleAppqaChange={handleAppqaChange}
            />}

        </div>
    )
}
export { TitleContainer }
