
import React, { useEffect, useRef, useState } from 'react';
import { Kebab24x24 } from '@n20a/libicon';
import { OverlayPanel } from 'primereact/overlaypanel'

import './OverlayIconStrip.css';
import { MainMenu } from '../mainmenu/MainMenu';
import { ActionImage } from '../../basic/actionimage/ActionImage';

interface IOverlayActionProps {
    isVertical: boolean; // Display action images vertically or horizontally
    w: string; // Width of the entire container
    h?: string; // Height of the entire container
    bgColor: string; // Background color
    border: string; // Border style
    menuSize: 'sm' | 'md' | 'lg'; // Menu size
    actionImageW: number; // Action image width in pixels
    actionImageH: number; // Action image height in pixels
    imageW: string; // Individual image width (CSS value)
    spacing: string; // Spacing between action images (CSS shorthand)
    isIconVertical: boolean; // Stack icon and label vertically
    hideLabel: boolean; // Hide labels
    imageH?: string; // Individual image width (CSS value)
}

interface IOverlayIconStrip {
    uniqueName: string; // Unique identifier and required
    children?: React.ReactNode; // Content to overlay
    OverlayActionProps: IOverlayActionProps; // Properties for action images
    OverlayActions: any;
    OverlayItemlistAlignNormal?: boolean; // Align items normally
    KebabMenuActions?: any;
    allowToolbarOnly?: boolean;
    handleSelect: (event: React.MouseEvent | MouseEvent | undefined, actionCode?: string | undefined, payload?: any) => void;
}

const SUBMENU_SHOW_DELAY_MS = 200;

const OverlayIconStrip: React.FC<IOverlayIconStrip> = (props: IOverlayIconStrip) => {
    const hideMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideSubMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showSubMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafIdsRef = useRef<number[]>([]);

    const kebabOverlayRef = useRef<OverlayPanel>(null);
    const subMenuOverlayRef = useRef<OverlayPanel>(null);
    const isHoveringRef = useRef(false);
    const isKebabOpenRef = useRef(false);
    const [isShowMenu, setIsShowMenu] = useState(props.allowToolbarOnly ? true : false);

    // Cancels the submenu opening delay.
    const cancelShowSubMenuTimeout = () => {
        if (showSubMenuTimeoutRef.current) {
            clearTimeout(showSubMenuTimeoutRef.current);
            showSubMenuTimeoutRef.current = null;
        }
    };

    // Shows the submenu overlay.
    const showSubMenuAtTarget = (event: React.MouseEvent<HTMLElement>, target: HTMLElement) => {
        const overlay = subMenuOverlayRef.current;
        if (!overlay) return;

        overlay.show(event, target);
        const rafId1 = requestAnimationFrame(() => {
            const rafId2 = requestAnimationFrame(() => {
                overlay.align();
            });
            rafIdsRef.current.push(rafId2);
        });
        rafIdsRef.current.push(rafId1);
    };

    // Shows the kebab menu overlay.
    const handleMouseEventForKebab = (event: any, actionCode?: string, payload?: any) => {
        isKebabOpenRef.current = true;
        const overlay = kebabOverlayRef.current;
        if (!overlay) return;
        overlay.show(event, event.currentTarget);
        const rafId1 = requestAnimationFrame(() => {
            const rafId2 = requestAnimationFrame(() => {
                overlay.align();
            });
            rafIdsRef.current.push(rafId2);
        });
        rafIdsRef.current.push(rafId1);

    }

    // Handles a submenu action.
    function handleMouseOverlayAction(event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string, payload?: any): void {
        cancelShowSubMenuTimeout();
        subMenuOverlayRef.current?.hide();
        setIsShowMenu(false);
        let mainData: any = { ...event, payload: payload }
        props.handleSelect(mainData, actionCode, payload)
    }

    // Handles a kebab menu action.
    function handleKabebMenuActions(value: any, actionCode?: string | undefined, payload?: any): void {
        isKebabOpenRef.current = false;
        kebabOverlayRef.current?.hide();
        setIsShowMenu(false);
        props.handleSelect(value, actionCode, payload)
    }

    // Opens the submenu on hover.
    const handleMouseEnterForSubMenuStip = (event: React.MouseEvent<HTMLElement>) => {
        isHoveringRef.current = true;
        if (hideSubMenuTimeoutRef.current) {
            clearTimeout(hideSubMenuTimeoutRef.current);
        }
        cancelShowSubMenuTimeout();
        const target = event.currentTarget;
        showSubMenuTimeoutRef.current = setTimeout(() => {
            showSubMenuTimeoutRef.current = null;
            showSubMenuAtTarget(event, target);
            setIsShowMenu(true);
        }, SUBMENU_SHOW_DELAY_MS);
    };

    // Closes the submenu after hover.
    const handleMouseLeaveForSubMenuStrip = () => {
        isHoveringRef.current = false;
        cancelShowSubMenuTimeout();
        hideSubMenuTimeoutRef.current = setTimeout(() => {
            if (!isHoveringRef.current && !isKebabOpenRef.current) {
                subMenuOverlayRef.current?.hide();
                setIsShowMenu(false);
            }
        }, 300);
    }

    const OverlayContent = (
        <div className={`nz-overlay-strip-content`}
            onMouseEnter={() => {
                isHoveringRef.current = true;

                if (hideSubMenuTimeoutRef.current) {
                    clearTimeout(hideSubMenuTimeoutRef.current);
                }
            }}
            onMouseLeave={handleMouseLeaveForSubMenuStrip}
        >
            {props?.OverlayActionProps && props?.OverlayActions?.length > 0 &&
                <MainMenu
                    uniqueName={props.uniqueName + "sidebar-action-image-strip"}
                    isVertical={props.OverlayActionProps.isVertical}
                    w={props.OverlayActionProps.w}
                    h={props.OverlayActionProps.h ?? props.OverlayActionProps.w}
                    bgColor={props.OverlayActionProps.bgColor}
                    border={props.OverlayActionProps.border}
                    menuSize={props.OverlayActionProps.menuSize}
                    actionImageW={props.OverlayActionProps.actionImageW}
                    actionImageH={props.OverlayActionProps.actionImageH}
                    compact={true}
                    imageW={props.OverlayActionProps.imageW}
                    imageH={props.OverlayActionProps?.imageH ?? props.OverlayActionProps.imageW}
                    spacing={props.OverlayActionProps.spacing}
                    isIconVertical={props.OverlayActionProps.isIconVertical}
                    hideLabel={props.OverlayActionProps.hideLabel}
                    featureData={props.OverlayActions}
                    itemlistAlignNormal={props.OverlayItemlistAlignNormal}
                    {...(props?.KebabMenuActions?.length > 0 && props.OverlayActions.length > 0
                        ? {
                            optionalComponent: {
                                component: ActionImage,
                                props: {
                                    uniqueName: props.uniqueName + "bi1",
                                    image: {
                                        uniqueName: props.uniqueName + "Kebabimage",
                                        source: <Kebab24x24 size={18} fill='none' strokeWidth={1} />,
                                        type: "svg",
                                        w: "var(--image-size-2)",
                                        h: "var(--image-size-2)",
                                        tooltip: "click to use commands"
                                    },
                                    w: "var(--image-size-2)",
                                    h: "var(--image-size-2)",
                                    allowAnimations: false,
                                    handleMouse: handleMouseEventForKebab,
                                    handleMouseEnter: handleMouseEventForKebab
                                }
                            }
                        }
                        : {})}
                    // handleMouseEnter={handleMouseEventForKebab} // Hint TU  : use This logic for to Show DCI menu
                    handleMouse={handleMouseOverlayAction}
                />}
        </div>
    );

    // Cleans up timers and animation frames.
    useEffect(() => {
        return () => {
            cancelShowSubMenuTimeout();
            if (hideMenuTimeoutRef.current) {
                clearTimeout(hideMenuTimeoutRef.current);
            }
            if (hideSubMenuTimeoutRef.current) {
                clearTimeout(hideSubMenuTimeoutRef.current);
            }
            rafIdsRef.current.forEach(id => cancelAnimationFrame(id));
        };
    }, []);

    return (
        <div className="nz-overlay-strip-container nz-overlay-strip-relative" key={props.uniqueName}>

            {/*  Trigger Area */}
            {props?.children && <div
                className="nz-overlay-strip-relative"
                onMouseEnter={(event) => {
                    isHoveringRef.current = true;

                    if (props?.OverlayActions?.length === 0) {
                        handleMouseEventForKebab(event);
                    } else {
                        handleMouseEnterForSubMenuStip(event);
                    }
                }}
                onMouseLeave={() => {
                    isHoveringRef.current = false;
                    handleMouseLeaveForSubMenuStrip();
                }}
            >
                <div style={{ visibility: isShowMenu && props?.OverlayActions?.length > 0 ? 'hidden' : 'visible' }}>
                    {props.children}
                </div>
            </div>}

            {/*  MainMenu Overlay */}
            {!props.allowToolbarOnly &&
                <OverlayPanel
                    ref={subMenuOverlayRef}
                    dismissable={true}
                    onHide={() => {
                        setIsShowMenu(false);
                    }}
                    className="nz-node-menu-popover nz-popover-three-dots-menu-div"
                    onShow={() => {
                        const el = kebabOverlayRef.current?.getElement?.();

                        if (el) {
                            el.style.transform = "translateY(-100%)";
                        }
                    }}
                >
                    {OverlayContent}
                </OverlayPanel>
            }

            {/*  Kebab Overlay */}
            <div className="nz-overlay-strip-kabeb-menus">
                <OverlayPanel
                    ref={kebabOverlayRef}
                    dismissable={true}
                    onHide={() => {
                        isKebabOpenRef.current = false;

                        //  CLOSE FIRST OVERLAY ALSO
                        subMenuOverlayRef.current?.hide();
                        setIsShowMenu(false);
                    }}
                    className="nz-node-menu-popover nz-popover-three-dots-menu-div nz-node-menu-popover-kabeb"
                >
                    <div
                        className='nz-node-menu-paper-container-div'
                        onMouseEnter={() => {
                            isHoveringRef.current = true;

                            if (hideMenuTimeoutRef.current) {
                                clearTimeout(hideMenuTimeoutRef.current);
                            }
                        }}
                        onMouseLeave={() => {
                            isHoveringRef.current = false;

                            hideMenuTimeoutRef.current = setTimeout(() => {
                                if (!isHoveringRef.current) {
                                    isKebabOpenRef.current = false;
                                    kebabOverlayRef.current?.hide();
                                }
                            }, 300);
                        }}
                    >
                        <MainMenu
                            isIconVertical={false}
                            uniqueName={props.uniqueName + "NodeMenu"}
                            actionImageW='100%'
                            actionImageH="var(--submenu_height)"
                            w="fit-content"
                            h=""
                            bgColor="var(--bg-color-menu)"
                            imageW={18}
                            imageH={18}
                            menuSize="sm"
                            isVertical={true}
                            allowDND={true}
                            featureData={props.KebabMenuActions}
                            handleSelect={handleKabebMenuActions}
                        />
                    </div>
                </OverlayPanel>
            </div>
        </div>
    );
};

export default OverlayIconStrip;
export type { IOverlayIconStrip, IOverlayActionProps };
