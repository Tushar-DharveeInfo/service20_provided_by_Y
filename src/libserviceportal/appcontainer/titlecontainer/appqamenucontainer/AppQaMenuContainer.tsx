import { KeyboardEvent, MouseEvent, useEffect, useMemo, useRef } from 'react'
import { TitleLogoWithTagline } from '../titlelogowithtagline/TitleLogoWithTagline'
import { MainMenu } from '../../../shared/menu/mainmenu/MainMenu';
import { FnGetCssVariable } from '../../../shared/allcommon/FnGetCssVariable';
import { IMenuItem } from '../../../shared/allinterface/menu/IMainMenu';
import './AppQaMenuContainer.css'
import { OverlayPanel } from 'primereact/overlaypanel';
import './AppQaMenuContainer.css'

const SUBMENU_SHOW_DELAY_MS = 200;

const MORE_FEATURE = "45";
const TAG_LINE_CONTENT = "Service"

type AppQaMenuContainerProps = {
    uniqueName: string;
    appqaData: { Menu: IMenuItem[], subMenu: IMenuItem[] };
    logoImageTooltip?: string;
    selectedFeature?: any;
    handleAppqaChange: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string, payload?: any) => void
}

const AppQaMenuContainer = (props: AppQaMenuContainerProps) => {
    const logoImageSource = "/privateimages/Licensee_Logo.png";
    const logoFallbackSrc = "/privateimages/NetZoom_Logo_Blue.png"
    const op = useRef<any>(null);
    const rafIdsRef = useRef<number[]>([]);
    const timeoutIdsRef = useRef<number[]>([]);
    const showOverlayTimeoutRef = useRef<number | null>(null);
    const isOpenMoreMenu = useRef(false);
    const appqaMenuData = useMemo(() => {
        if (!props.appqaData?.Menu) {
            return props.appqaData;
        }

        return {
            ...props.appqaData,
            Menu: props.appqaData.Menu.map(menuItem =>
                menuItem?._Feature?.toString() === MORE_FEATURE
                    ? { ...menuItem, Tooltip: undefined }
                    : menuItem
            )
        };
    }, [props.appqaData]);

    // Clear the delayed overlay show timer if it is still pending.
    const cancelShowOverlayTimeout = () => {
        if (showOverlayTimeoutRef.current !== null) {
            clearTimeout(showOverlayTimeoutRef.current);
            showOverlayTimeoutRef.current = null;
        }
    };

    // Cancel all pending overlay timers and animation frames.
    const cancelPendingAnimations = () => {
        cancelShowOverlayTimeout();
        rafIdsRef.current.forEach(id => cancelAnimationFrame(id));
        timeoutIdsRef.current.forEach(id => clearTimeout(id));
        rafIdsRef.current = [];
        timeoutIdsRef.current = [];
    };

    // Keep the overlay panel within the visible viewport bounds.
    const keepOverlayInsideViewport = (overlay: any) => {
        const el = (overlay?.getElement?.() ?? overlay?.container) as HTMLElement | undefined;
        if (!el) return;

        const viewportPadding = 10;
        el.style.maxWidth = `calc(100vw - ${viewportPadding * 2}px)`;

        const rect = el.getBoundingClientRect();
        const maxViewportLeft = Math.max(viewportPadding, window.innerWidth - rect.width - viewportPadding);
        const nextViewportLeft = Math.min(Math.max(rect.left, viewportPadding), maxViewportLeft);

        if (nextViewportLeft === rect.left) return;

        const position = window.getComputedStyle(el).position;
        const left = position === 'fixed' ? nextViewportLeft : nextViewportLeft + window.scrollX;

        el.style.left = `${left}px`;
        el.style.right = 'auto';
    };

    // Reposition overlay after open using rAF and a short follow-up pass.
    const alignOverlayInsideViewport = (overlay: any) => {
        cancelPendingAnimations();

        const rafId1 = requestAnimationFrame(() => {
            keepOverlayInsideViewport(overlay);
            const rafId2 = requestAnimationFrame(() => keepOverlayInsideViewport(overlay));
            rafIdsRef.current.push(rafId2);

            const timeoutId = window.setTimeout(() => keepOverlayInsideViewport(overlay), 50);
            timeoutIdsRef.current.push(timeoutId);
        });
        rafIdsRef.current.push(rafId1);
    };

    // Open the More submenu overlay on hover after a short delay.
    const handleMouseEnter = (event: any, _actionCode?: string, payload?: any) => {
        cancelShowOverlayTimeout();

        if (payload?._Feature?.toString() !== MORE_FEATURE || !event) {
            return;
        }
        isOpenMoreMenu.current = true;
        const nativeEvent = event?.nativeEvent;
        const target = event.currentTarget as HTMLElement;

        showOverlayTimeoutRef.current = window.setTimeout(() => {
            showOverlayTimeoutRef.current = null;
            const overlay = op.current;
            if (!overlay) return;

            overlay.show(nativeEvent, target);
            alignOverlayInsideViewport(overlay);
        }, SUBMENU_SHOW_DELAY_MS);
    }

    // Handle submenu item selection and close the overlay.
    function handleSelectNode(_value: any, actionCode?: string | undefined, payload?: any): void {
        props.handleAppqaChange(undefined, actionCode, payload);
        handleMouseLeave();
    }
    // Cancel pending overlay open when the pointer leaves the main menu strip.
    const handleMenuMouseLeave = () => {
        cancelShowOverlayTimeout();
    };

    // Close the More submenu overlay and reset its open state.
    const handleMouseLeave = () => {
        isOpenMoreMenu.current = false;
        cancelPendingAnimations();
        op.current?.hide();
    };

    // Close overlay on outside click and clean up timers on unmount.
    useEffect(() => {
        // Hide overlay when user clicks outside of it.
        const handleOutsideClick = (event: globalThis.MouseEvent) => {
            const overlay = op.current;
            const overlayElement = (overlay?.getElement?.() ?? overlay?.container) as HTMLElement | undefined;
            if (!overlayElement) return;

            const target = event.target as Node | null;
            if (target && overlayElement.contains(target)) return;

            overlay.hide();
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            cancelPendingAnimations();
        };
    }, []);

    // Move keyboard focus to the first item in the open submenu overlay.
    const focusFirstSubMenuItem = () => {
        const overlayElement = (op.current?.getElement?.() ?? op.current?.container) as HTMLElement | undefined;
        if (!overlayElement) return;

        const firstFocusable = overlayElement.querySelector<HTMLElement>(
            '.nz-image-list-data[tabindex]:not([tabindex="-1"]), .nz-image-strip-data[tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
    };

    // Toggle More submenu on click/keyboard or forward other app QA menu actions.
    function handleMouse(event: unknown, actionCode?: string | undefined, payload?: any): void {
        if (payload?._Feature?.toString() === MORE_FEATURE) {
            if (isOpenMoreMenu.current) {
                handleMouseLeave();
            } else {
                handleMouseEnter(event, actionCode, payload);
                window.setTimeout(focusFirstSubMenuItem, SUBMENU_SHOW_DELAY_MS + 50);
            }
        } else {
            props.handleAppqaChange(event as React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode, payload);
        }
    }

    // Close the overlay when Escape is pressed.
    const handleOverlayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            handleMouseLeave();
        }
    };

    return (
        <div className='nz-app-qa-menu-Container' tabIndex={1}>
            <div className='nz-app-title-image'>
                <TitleLogoWithTagline uniqueName={'title-with-logo-and-tagline'}
                    logoImageSource={logoImageSource}
                    logoImageTooltip={props.logoImageTooltip}
                    redirectUrl="https://www.netzoom.com/"
                    tagLineContent={TAG_LINE_CONTENT}
                    logoFallbackSrc={logoFallbackSrc} />
            </div>
            <div className='nz-app-qa-menus'>
                {appqaMenuData && <MainMenu menuSize={"sm"}
                    featureData={appqaMenuData.Menu}
                    uniqueName={"titlebar"}
                    w={"100%"}
                    h={"40px"}
                    actionImageW={"40px"}
                    isVertical={false}
                    itemlistAlignNormal={true}
                    compact={true}
                    isIconVertical={true}
                    allowDND={false}
                    bgColor="inherit"
                    imageW={FnGetCssVariable('--image-size-2')}
                    imageH={FnGetCssVariable('--image-size-2')}
                    selectedFeature={props.selectedFeature}
                    handleMouseEnter={handleMouseEnter}
                    handleMouseLeave={handleMenuMouseLeave}
                    handleMouse={handleMouse} />}
                <div className='nz-ovelay-ap-menu'>
                    <OverlayPanel
                        ref={op}
                        appendTo={document.body}
                        dismissable={false}
                        className='nz-ap-qa-ovelay-menu'
                        onShow={() => alignOverlayInsideViewport(op.current)}

                    >
                        <div
                            onMouseLeave={handleMouseLeave}
                            onKeyDown={handleOverlayKeyDown}
                        >
                            {appqaMenuData.subMenu && <MainMenu
                                isIconVertical={true}
                                uniqueName="NodeMenu"
                                actionImageW='100%'
                                actionImageH="var(--submenu_height)"
                                w="fit-content" // Width of the entire container
                                h="100%"
                                allowDND={false}
                                bgColor="var(--bg-color-menu)" // Background color of the container
                                imageW={20}
                                imageH={20}
                                menuSize="sm"
                                isVertical={true}
                                featureData={appqaMenuData.subMenu}
                                isDisableSort={false}
                                hideSearchControl={true}
                                isShowExpandableList={false}
                                handleSelect={handleSelectNode}
                                hideIconExpandableList={true}
                            />}
                        </div>
                    </OverlayPanel>
                </div>

            </div>
        </div >
    )
}
export { AppQaMenuContainer }
