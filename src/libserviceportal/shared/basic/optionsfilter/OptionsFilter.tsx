
import React, { useEffect, useRef, useState } from 'react'
import { Popover } from '@mui/material';
import { Filter24x24, SelectColumns24x24 } from '@n20a/libicon';
import '../../allcss/basic/OptionsFilter.css';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable';
import { IOptionItem, IOptionsFilter } from '../../allinterface/basic/IOptionsFilter';
import { ActionImage } from '../actionimage/ActionImage';
import { YesNoControl } from '@n20a/libform';

const SUBMENU_SHOW_DELAY_MS = 200;

const OptionsFilter = (props: IOptionsFilter) => {
    const [mouseX, setMouseX] = useState<Number>(0);
    const [mouseY, setMouseY] = useState<Number>(0);
    const [isShowMenu, setIsShowMenu] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLImageElement | null>(null);
    const [rightMouseData, setRightMouseData] = useState<IOptionItem[]>([]);
    const showMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelShowMenuTimeout = () => {
        if (showMenuTimeoutRef.current) {
            clearTimeout(showMenuTimeoutRef.current);
            showMenuTimeoutRef.current = null;
        }
    };

    const openMenuAtEvent = (event: React.MouseEvent<HTMLImageElement>) => {
        setMouseX(event.clientX);
        setMouseY(event.clientY);
        setIsShowMenu(true);
        setAnchorEl(event.target as HTMLImageElement);
    };

    useEffect(() => {
        setRightMouseData(props.options)
    }, [props.options])

    useEffect(() => {
        return () => {
            cancelShowMenuTimeout();
        };
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLImageElement>, actionCode?: string) => {
        if (actionCode === "RightMouseMenu") {
            cancelShowMenuTimeout();
            openMenuAtEvent(event);
        }
    }

    const handleMouseEnter = (
        event: React.MouseEvent<HTMLDivElement>,
        actionCode?: string,
        _payload?: Record<string, any>
    ) => {
        if (actionCode !== "RightMouseMenu") {
            return;
        }

        cancelShowMenuTimeout();
        const clientX = event.clientX;
        const clientY = event.clientY;
        const target = event.target as HTMLImageElement;

        showMenuTimeoutRef.current = setTimeout(() => {
            showMenuTimeoutRef.current = null;
            setMouseX(clientX);
            setMouseY(clientY);
            setIsShowMenu(true);
            setAnchorEl(target);
        }, SUBMENU_SHOW_DELAY_MS);
    };

    const handleMenuMouseLeave = (
        _event?: React.MouseEvent<HTMLDivElement>,
        _actionCode?: string,
        _payload?: Record<string, any>
    ) => {
        cancelShowMenuTimeout();
    };

    const handleValueChange = (
        value: string,
        name: string,
        isDefault?: boolean
    ) => {
        if (isDefault) return;

        let selectedItem: IOptionItem | null = null;

        const currentItem = rightMouseData.find((item) => item.uniqueName === name);
        if (currentItem?.disabled && value === "0") {
            return;
        }

        const updatedData = rightMouseData.map((item) => {
            const updatedItem = { ...item };

            if (props.allowMultiSelect) {
                if (updatedItem.uniqueName === name) {
                    updatedItem.value = value;
                    selectedItem = updatedItem;
                }
            } else {
                if (updatedItem.uniqueName === name) {
                    updatedItem.value = value; // allows both 1 and 0
                    if (value === "1") {
                        selectedItem = updatedItem;
                    }
                } else {
                    updatedItem.value = "0";
                }
            }

            return updatedItem;
        });
        setRightMouseData(updatedData);
        props.handleSelect(selectedItem, updatedData);
    };


    return (
        <div key={props.uniqueName} className='nz-option-toggle-control'>
            <div className='nz-right-mouse-menu'>
                {/* show kebab image. */}
                {props.showIcon && <ActionImage
                    {...{
                        image: {
                            uniqueName: "Kebabimage",
                            source: props.showSelectColumnIcon ? <SelectColumns24x24
                                size={FnGetCssVariable('--image-size-2')}
                                fill='none'
                                strokeWidth={1} /> : <Filter24x24
                                size={FnGetCssVariable('--image-size-2')}
                                fill='none'
                                strokeWidth={1} />,
                            type: "svg",
                            w: "var(--image-size-2)",
                            h: "var(--image-size-2)",
                            tooltip: props.showSelectColumnIcon ? "Select Columns" : "Filter"
                        },
                        handleMouse(event, actionCode) {
                        },
                        uniqueName: "Kebab",
                        w: 'var(--node_height)',
                        h: 'var(--node_height)',
                        actionCode: "RightMouseMenu",
                    }}
                    handleMouse={(event: any, actionCode: any) => handleClick(event, actionCode)}
                    handleMouseEnter={handleMouseEnter}
                    handleMouseLeave={handleMenuMouseLeave}
                />}
            </div>
            {/* show popup with option toggle, checkbox and label. */}
            <Popover
                open={isShowMenu}
                className="nz-popover-three-dots-menu-div nz-options-filter-popover"
                anchorReference="anchorPosition"
                anchorPosition={{ top: mouseY.valueOf() ?? 0, left: mouseX.valueOf() ?? 0 }}
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
                    {rightMouseData.length > 0 && props.allowHeader && <div className='nz-option-filter-toggle-control nz-option-header'>Select Columns</div>}
                    {rightMouseData.map((item: IOptionItem, index: number) => {
                        return (
                            <div key={index} className='nz-option-filter-toggle-control'>
                                <YesNoControl name={item.uniqueName}
                                    label={item.label}
                                    value={item.value === "1"}
                                    disabled={!!item.disabled}
                                    onChange={(value: boolean) => {
                                        handleValueChange(value ? "1" : "0", item.uniqueName);
                                    }} />
                            </div>
                        )
                    })}
                </div>
            </Popover>
        </div>
    )
}
export { OptionsFilter }