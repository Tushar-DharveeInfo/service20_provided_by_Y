
import { useEffect, useState } from 'react'
import { useSessionContext } from '../../context/hooks/SessionHooks'
import { FnGetIconForSubMenu } from '../../allcommon/menu/FnGetIconForSubMenu'
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { FnGetMainMenus } from '../../allcommon/menu/FnGetMainMenus'
import { FnGetSubMenus } from '../../allcommon/menu/FnGetSubMenus'
import { FnUpdateFeatureLabelFromSession } from '../../allcommon/basic/FnUpdateFeatureLabelFromSession'
import { IActionImage } from '../../allinterface/basic/IActionImage'
import { IMenuItem, IMainMenu } from '../../allinterface/menu/IMainMenu'
import { IActionImageForSubMenu, IActionImageList } from '../../allinterface/basic/IActionImageList'
import { IActionImageStrip } from '../../allinterface/basic/IActionImageStrip'
import { ExpandableList } from './ExpandableList'
import { ActionImageStrip } from '../../basic/actionimagestrip/ActionImageStrip'
import { ActionImageList } from '../../basic/actionimagelist/ActionImageList'

const MainMenu = (menuProps: IMainMenu) => {
  const [actionImages, setActionImages] = useState<IActionImage[] | null>(null)
  const [subMenuProps, setSubMenuProps] = useState<IMainMenu | null>(null)
  const [menuData, setMenuData] = useState<IMenuItem[] | null>(null)
  const [selectedFeatureItem, setSelectedFeatureItem] = useState<IMenuItem>();
  const [sessionValues, setSessionValues] = useState<string>();
  const sessionContext = useSessionContext();
  const setSubMenuData = (menu: IMenuItem[], selectedMenu?: IMenuItem, updatedFeatures?: IMenuItem[]) => {
    if (menu && menu.length > 0) {
      if (!menuProps.isDisableSort) {

        menu = menu.sort(
          (a: any, b: any) => a.SortOrder - b.SortOrder
        );
      }
      menu.forEach((element: IMenuItem) => {
        const submenu = FnGetSubMenus(updatedFeatures ?? menuProps.featureData, element.MenuID, element.Label);
        if (selectedMenu) {
          const selectedId = selectedMenu.EntID ? String(selectedMenu.EntID) : "";
          const selectedFeatureId = selectedMenu._Feature != null ? String(selectedMenu._Feature) : "";
          const selectedMenuSub = submenu?.find((sub) => {
            const subEntId = sub.EntID ? String(sub.EntID) : "";
            const subFeatureId = sub._Feature != null ? String(sub._Feature) : "";
            if (selectedId && subEntId && selectedId === subEntId) return true;
            if (selectedFeatureId && subFeatureId && selectedFeatureId === subFeatureId) return true;
            return false;
          });
          if (selectedMenuSub) {
            element.isOpen = true;
          }
        }
        element.subMenu = submenu
        if (menuProps.uniqueName === "configure" && element.subMenu && element.subMenu.length > 0) {
          element.isOpen = true;
        }

      });
      setMenuData(menu);
    }
  }


  useEffect(() => {
    if (menuProps.featureData) {

      if (menuProps.uniqueName === "Menu") {
        const updated_feature_data = FnUpdateFeatureLabelFromSession(menuProps.featureData, sessionContext.SessionList)
        let listOfMainMenu = FnGetMainMenus(updated_feature_data);


        setSubMenuData(listOfMainMenu, menuProps.selectedFeature, updated_feature_data)
      } else if (menuProps.isShowExpandableList) {

        setSubMenuData(menuProps.featureData)
      } else {
        setMenuData(null)
        const getIconForSubMenu = (fileName: string, item: IMenuItem) => {
          const Icon = FnGetIconForSubMenu(fileName);
          return <Icon size={menuProps.imageW ? menuProps.imageW : item.PopupQa ? 24 : FnGetCssVariable('--image-size-2')}
            fill='none'
            strokeWidth={1} />
        }
        const actionImages: IActionImageForSubMenu[] = []
        menuProps.featureData.forEach((item: IMenuItem, index: number) => {
          const actionImageData: IActionImageForSubMenu = {
            uniqueName: item.Label, // uniqueName for the control and required
            image: {
              uniqueName: `${item.Label}-image`,
              source: getIconForSubMenu(item.Alias ? item.Alias : `${(item.Name || item.name || item.Label || '').replace(/[^0-9A-Za-z_-]/g, "")}24x24`, item),
              w: menuProps.imageW ? menuProps.imageW : item.PopupQa ? 24 : FnGetCssVariable('--image-size-2'),
              h: menuProps.imageH ? menuProps.imageH : item.PopupQa ? 24 : FnGetCssVariable('--image-size-2'),
              type: "svg"
            },
            ...(!menuProps.hideLabel && {
              label: {
                uniqueName: `${item.Label}-label`,
                label: item.Label,
                fontSize: menuProps.isIconVertical ? "8px" : '14px',
              }
            }),
            tooltip: item.Tooltip,
            w: menuProps.actionImageW ? menuProps.actionImageW : 40,
            h: menuProps.actionImageH ? menuProps.actionImageH : menuProps.actionImageW,
            border: menuProps.border,
            labelAlign: "bottom",
            actionCode: item._Feature ? item._Feature.toString() : item.Label ? item.Label : JSON.stringify(item),
            selected: item.selected ? item.selected : false,
            separator: menuProps.featureData.length === index + 1 ? false : item && (item?.NodeType && item?.NodeType?.includes("Separator")
              || (item.separator && item.separator.toString()?.toLowerCase().includes('true'))) ? true : false,
            payload: menuProps.uniqueName === "edit_report_layout_menu" ? item.payload : item.payload ? item.payload : item,
            PopupQa: item.PopupQa,
            draggable: item.draggable && item.draggable.toString()?.toLowerCase() === "true",
            handleMouse: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string, payload?: unknown): void => { },
            handleMouseEnter: (event: React.MouseEvent<HTMLDivElement>, actionCode?: string, payload?: unknown): void => { }
          }
          actionImages.push(actionImageData)
        })

        setActionImages(actionImages)
        let menuData: IMainMenu = {
          actionImages: actionImages,
          uniqueName: menuProps.uniqueName,
          isVertical: menuProps.isVertical,
          w: menuProps.w,
          h: menuProps.h,
          itemlistAlignNormal: menuProps.itemlistAlignNormal,
          menuActionImage: menuProps.menuActionImage,
          optionalComponent: menuProps.optionalComponent,
          bgColor: menuProps.bgColor,
          border: menuProps.border,
          spacing: menuProps.spacing,
          isIconVertical: menuProps.isIconVertical,
          menuSize: menuProps.menuSize,
          compact: menuProps.compact,
          allowDND: menuProps.allowDND,
          featureData: menuProps.featureData
        }
        setSubMenuProps({ ...menuData })
      }
    }
  }, [menuProps.featureData, menuProps.uniqueName, menuProps.selectedFeature, sessionValues])
  function handleMouseEventForMenuList(event: React.MouseEvent<HTMLDivElement, MouseEvent> | undefined, actioncode: string, selectedMenu: any): void {
    menuProps.handleSelect && menuProps.handleSelect(event, actioncode, selectedMenu)
  }

  function handleMouse(event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string | undefined, payload?: any): void {
    menuProps.handleMouse && menuProps.handleMouse(event, actionCode, payload)
  }

  function handleSelect(value: any, actionCode?: string, payload?: any): void {
    menuProps.handleSelect && menuProps.handleSelect(value, actionCode, payload)
  }
  function handleMouseLeave(): void {
    if (menuProps.handleMouseLeave) {
      menuProps.handleMouseLeave()
    }
  }

  function handleDrag(event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any): void {
    menuProps.handleDrag && menuProps.handleDrag(event, actionCode, payload)
  }
  function handleDragEnd(event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any): void {
    menuProps.handleEndDrag && menuProps.handleEndDrag(event, actionCode, payload)
  }
  function handleStartDrag(event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any): void {
    menuProps.handleStartDrag && menuProps.handleStartDrag(event, actionCode, payload)
  }
  function handleMouseEnter(event: MouseEvent | undefined, actionCode?: string | undefined, payload?: any): void {
    menuProps.handleMouseEnter && menuProps.handleMouseEnter(event, actionCode, payload)
  }

  useEffect(() => {
    if (selectedFeatureItem && menuProps.handleSelect) {
      menuProps.handleSelect(null, "", selectedFeatureItem)

    }
  }, [selectedFeatureItem, menuProps.handleSelect])

  return (
    <>
      {menuData && <ExpandableList
        menuData={menuData}
        uniqueName={menuProps.uniqueName}
        selectedFeature={menuProps.selectedFeature}
        hideSearchControl={menuProps.hideSearchControl}
        hideIcon={menuProps.hideIconExpandableList}
        isMenuWithAbsolute={menuProps.isMenuWithAbsolute}
        handleDrag={handleDrag}
        handleEndDrag={handleDragEnd}
        handleMouseEvent={handleMouseEventForMenuList}
        handleMouseLeave={handleMouseLeave}
        handleStartDrag={handleStartDrag}
      />
      }

      {!menuData && subMenuProps && subMenuProps.isIconVertical === true && subMenuProps.compact === true ?
        (subMenuProps.optionalComponent || actionImages || subMenuProps.menuActionImage ?
          <ActionImageStrip
            {...subMenuProps as IActionImageStrip}
            selectedFeature={menuProps.selectedFeature}
            selectedFeatureQa={menuProps.selectedFeatureQa}
            isAppQA={menuProps.isAppQA}
            hideLabel={menuProps.hideLabel}
            handleMouse={handleMouse}
            handleDrag={handleDrag}
            handleEndDrag={handleDragEnd}
            handleStartDrag={handleStartDrag}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
          /> : <></>) : <></>}


      {subMenuProps && !subMenuProps.compact &&
        <ActionImageList
          {...subMenuProps as IActionImageList}
          handleSelect={handleSelect}
          handleDrag={handleDrag}
          handleEndDrag={handleDragEnd}
          handleMoseLeave={handleMouseLeave}
          handleStartDrag={handleStartDrag}
        />}
    </>
  )
}

export { MainMenu }