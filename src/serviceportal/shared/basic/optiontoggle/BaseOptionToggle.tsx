
import React, { useState } from 'react'
import { Popover } from '@mui/material';
import { IChangeMeta, YesNoControl } from '@n20a/libform';
import '../../allcss/basic/BaseOptionToggle.css';
import { IBaseOptionToggle } from '../../allinterface/basic/IBaseOptionToggle.ts';
import { searchControlChecks } from '../../alldefaultprops/basic/DefaultPropsOptionToggle.ts';
import { IOptionItem } from '../../allinterface/basic/IOptionsFilter.ts';
import { ActionImage } from '../actionimage/ActionImage.tsx'

const BaseOptionToggle = (baseMenuProps: IBaseOptionToggle) => {
  const [mouseX, setMouseX] = useState<number>();
  const [mouseY, setMouseY] = useState<number>();
  const [isShowMenu, setIsShowMenu] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLImageElement | null>(null);
  const [rightMouseData, setRightMouseData] = useState<IOptionItem[]>(searchControlChecks)

  const handleClick = (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLDivElement>,
    actionCode: string | undefined
  ): void => {
    try {
      if (actionCode !== "RightMouseMenu") {
        return;
      }

      // Handle only mouse events
      if ("clientX" in event && "clientY" in event) {
        setMouseX(event.clientX);
        setMouseY(event.clientY);
        setIsShowMenu(true);

        const target = event.currentTarget;

        if (target instanceof HTMLImageElement) {
          setAnchorEl(target);
        }
      }
    } catch (error) {
      console.error("Error in handleClick:", error);
    }
  };

  const handleValueChange = (value: string, name: string, isDefault?: boolean) => {
    if (!isDefault) {
      let array: IOptionItem[] = []
      searchControlChecks.forEach((item) => {
        if (item.label === name) {
          item.value = 1
        } else {
          item.value = 0
        }
        array.push(item)
      })
      setRightMouseData(array)
      baseMenuProps.handleSelect(name)
    }
  }
  return (
    <div key={baseMenuProps.uniqueName} className='nz-option-toggle-control'>
      <div className='nz-right-mouse-menu'>
        {/* show kebab image. */}
        {baseMenuProps.showIcon && <ActionImage
          {...baseMenuProps.imageObject}
          handleMouse={
            (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, actionCode: string | undefined) => {
              handleClick(event, actionCode)
            }}
        />}
      </div>
      {/* show popup with option toggle, checkbox and label. */}

      <Popover
        open={isShowMenu}
        className="nz-popover-three-dots-search-menu-div"
        anchorReference="anchorPosition"
        anchorPosition={{ top: mouseY || 0, left: mouseX || 0 }}
        anchorEl={anchorEl}
        aria-hidden={!isShowMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClick={() => {
          setAnchorEl(null);
          setIsShowMenu(false);
        }}

      >
        <div
          onMouseLeave={() => {
            setAnchorEl(null);
            setIsShowMenu(false);
          }}
          className='nz-option-filter-container'
        >
          {rightMouseData.map((item: IOptionItem, index: number) => {
            return (<div key={index} className='nz-option-filter-toggle-control'><YesNoControl
              name={item.uniqueName}
              label={item.label}
              value={item.value ? true : false}
              onChange={(value: boolean, meta: IChangeMeta) => {
                handleValueChange(String(value), item.uniqueName)
              }} /></div>)
          })}
        </div>
      </Popover>
    </div>
  )
}
export { BaseOptionToggle }