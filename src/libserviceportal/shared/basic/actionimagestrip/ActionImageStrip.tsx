
import React, { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import '../../allcss/basic/ActionImageStrip.css';
import { DefaultStylesActionImageStrip } from '../../alldefaultprops/basic/DefaultPropsActionImageStrip.ts';
import { Close24x24, Kebab24x24, ThemeDark24x24 } from '@n20a/libicon';
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable.ts';
import themes from '../../theme-provider.json';
import { IPropsComponent } from '../../allinterface/menu/IMainMenu.ts';
import { IActionImageForSubMenu } from '../../allinterface/basic/IActionImageList.ts';
import { IActionImageStrip } from '../../allinterface/basic/IActionImageStrip.ts';
import { IActionImage } from '../../allinterface/basic/IActionImage.ts';
import { ActionImage } from '../actionimage/ActionImage.tsx'
import { OptionalContainer } from './OptionalContainer.tsx';
import { MenuActionImage } from './MenuActionImage.tsx';
import { camelCase } from 'lodash';
import { FnGetSessionStorageItem } from '../../allcommon/basic/FnGetSessionStorageItem.ts';

const ActionImageStrip = (imageStripProps: IActionImageStrip) => {
    console.log('imageStripProps ActionImageStrip', imageStripProps)
    const [actionImages, setActionImages] = useState<IActionImage[]>([]);
    const [optionalComponent, setOptionalComponent] = useState<IPropsComponent | null>(null);
    const [selectedActionCode, setSelectedActionCode] = useState<string>();
    const [selectedThemeIndex, setSeletedThemeIndex] = useState<number>(0);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [showAppQa, setShowAppQa] = useState<boolean>(false);
    const [themeData, setThemeData] = useState<any>();
    const [value, setValue] = useState<string>('Light');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const leftArrowRef = useRef<HTMLButtonElement>(null);
    const rightArrowRef = useRef<HTMLButtonElement>(null);
    const topArrowRef = useRef<HTMLButtonElement>(null);
    const bottomArrowRef = useRef<HTMLButtonElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const hideMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollDownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafIdsRef = useRef<number[]>([]);

    const scrollAmount = 80;
    const width = (typeof imageStripProps.w === "string" ? imageStripProps.w : `${imageStripProps.w}px`) || DefaultStylesActionImageStrip.Width
    const height = (typeof imageStripProps.h === "string" ? imageStripProps.h : `${imageStripProps.h}px`) || DefaultStylesActionImageStrip.Height
    const dynamicStyle = {
        width: width,
        height: height,
        backgroundColor: imageStripProps.bgColor ? imageStripProps.bgColor : DefaultStylesActionImageStrip.BGColor,
        border: imageStripProps.border ? imageStripProps.border : DefaultStylesActionImageStrip.Border,
        padding: imageStripProps.spacing ? imageStripProps.spacing : "0px",
        justifyContent: imageStripProps.itemlistAlignNormal ? "end" : "start",
    }

    useEffect(() => {
        if (imageStripProps.actionImages) {
            setActionImages(imageStripProps.actionImages);
        } else {
            setActionImages([])
        }
    }, [imageStripProps]);

    useEffect(() => {
        if (imageStripProps.optionalComponent) {
            setOptionalComponent(imageStripProps.optionalComponent);
        } else {
            setOptionalComponent(null)
        }
    }, [imageStripProps.optionalComponent]);

    const handleMouse = (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | undefined, actionCode?: string, payload?: any) => {
        setSelectedActionCode(actionCode);

        if (imageStripProps.handleMouse) {
            imageStripProps.handleMouse(event, actionCode, payload);
        }
    }

    // Function to update arrow visibility
    const updateArrows = () => {
        if (!scrollContainerRef.current) return;

        const scrollContainer = scrollContainerRef.current;
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        if (leftArrowRef.current) {
            leftArrowRef.current.style.display = scrollContainer.scrollLeft > 0 ? "flex" : "none";
        }
        if (rightArrowRef.current) {
            rightArrowRef.current.style.display = scrollContainer.scrollLeft < maxScrollLeft - 2 ? "flex" : "none";
        }
        if (topArrowRef.current) {
            topArrowRef.current.style.display = scrollContainer.scrollTop > 0 ? "flex" : "none";
        }
        if (bottomArrowRef.current) {
            bottomArrowRef.current.style.display = scrollContainer.scrollTop < maxScrollTop - 2 ? "flex" : "none";
        }
    };

    // Scroll Left
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
            const rafId = requestAnimationFrame(updateArrows);
            rafIdsRef.current.push(rafId);
        }
    };

    // Scroll Right
    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
            const rafId = requestAnimationFrame(updateArrows);
            rafIdsRef.current.push(rafId);
        }
    };

    // Use ResizeObserver to track sidebar width changes
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        const sidebar = sidebarRef.current;

        if (!scrollContainer || !sidebar) return;

        // Resize observer for sidebar
        const resizeObserver = new ResizeObserver(() => {
            updateArrows();
        });

        resizeObserver.observe(sidebar);

        // Listen to scroll events
        scrollContainer.addEventListener("scroll", updateArrows);
        window.addEventListener("resize", updateArrows);

        // Initial check
        updateArrows();

        return () => {
            // Ensure we remove listeners only if the elements exist
            resizeObserver.disconnect();

            if (scrollContainer) {
                scrollContainer.removeEventListener("scroll", updateArrows);
            }

            window.removeEventListener("resize", updateArrows);
        };
    }, [actionImages]);
    const scrollUp = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: -scrollAmount, behavior: "smooth" });
            scrollUpTimeoutRef.current = setTimeout(updateArrows, 500);
        }
    };

    const scrollDown = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: scrollAmount, behavior: "smooth" });
            scrollDownTimeoutRef.current = setTimeout(updateArrows, 500);
        }
    };
    const dynamicStyleForOptional = {
        backgroundColor: imageStripProps.bgColor ? imageStripProps.bgColor : DefaultStylesActionImageStrip.BGColor,
        border: imageStripProps.border ? imageStripProps.border : DefaultStylesActionImageStrip.Border,
        padding: imageStripProps.spacing ? imageStripProps.spacing : "0px",
        justifyContent: imageStripProps.itemlistAlignNormal ? "end" : "start",
    }
    const handleDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => {
        imageStripProps.handleDrag && imageStripProps.handleDrag(event, actionCode, payload);
    };



    const handleEndDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => {
        const clientX: number = event.clientX;
        const clientY: number = event.clientY;

        const dropTarget = document.elementFromPoint(clientX, clientY) as HTMLElement;

        if (!dropTarget) return;

        // Look for nearest ancestor with allow-drop="true"
        const validDropContainer = dropTarget.closest('[allow-drop="true"]') as HTMLElement;

        if (validDropContainer) {
            imageStripProps.handleEndDrag && imageStripProps.handleEndDrag(event, actionCode, payload);
        }
    }

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => {
        imageStripProps.handleStartDrag && imageStripProps.handleStartDrag(event, actionCode, payload);
    };

    const isValidPayload = (payload: Record<string, unknown> | string): boolean => {
        try {
            if (payload === null || payload === undefined) {
                return false;
            }

            const value =
                typeof payload === "string"
                    ? payload.trim()
                    : JSON.stringify(payload).trim();

            return value !== "" && value !== "{}";
        } catch (error) {
            console.error("Error validating payload:", error);
            return false;
        }
    };

    const handleMouseEnter = (event: any, actionCode?: string, payload?: any) => {
        if (imageStripProps.handleMouseEnter) {
            imageStripProps.handleMouseEnter(event, actionCode, payload);
        }
    }

    const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>, actionCode?: string, payload?: any) => {
        imageStripProps.handleMouseLeave?.(event, actionCode, payload);
    }


    useEffect(() => {
        const themesFromStore = themes
        if (themesFromStore) {
            const parsedObject = themesFromStore
            if (parsedObject.data) {
                setThemeData(parsedObject.data);
            }
        }
        return () => {
            setActiveIndex(null);
        }
    }, [])
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const navigationKeys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Enter', ' ', 'Spacebar'];
        if (!navigationKeys.includes(event.key)) {
            return;
        }

        if (!actionImages.length) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            setActiveIndex((prev) => (Number(prev) + 1) % actionImages.length);
        }
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            setActiveIndex((prev) => (Number(prev) - 1 + actionImages.length) % actionImages.length);
        }
        if (event.key === "Enter") {
            // onSelect?.(actionImages[activeIndex]);
            if (actionImages[Number(activeIndex ?? 0)].uniqueName?.toLowerCase().includes("theme")) {
                // if (!value && themeData) {
                //     handleMouse(undefined, "theme", { ...themeData["dark"] });
                // }
                // else {
                //     handleMouse(undefined, "theme", { ...themeData["light"] });
                // }
                // setValue(!value)
                const themeKeys = Object.keys(themeData);         // ["dark", "green", "light"]
                let themeIndex = selectedThemeIndex + 1;

                if (themeIndex === themeKeys.length) themeIndex = 0;

                setSeletedThemeIndex(themeIndex);

                // pick the theme object using the key
                const selectedTheme = themeData[themeKeys[themeIndex]];

                // now use it
                handleMouse(undefined, "theme", selectedTheme);
                // }

                const string = camelCase((themeKeys[themeIndex]))
                setValue(string)
            } else {
                handleMouse(event, actionImages[Number(activeIndex ?? 0)].actionCode, actionImages[Number(activeIndex ?? 0)].payload)
            }
            setActiveIndex(null);
        }
        if (event.key === " " || event.key === "Spacebar") {
            const focusedEl = document.activeElement as HTMLElement;

            if (focusedEl?.classList.contains("nz-appqa-kebab-button")) {

                setShowAppQa(!showAppQa)
            } else {

                // You can apply checkbox toggle logic here if needed
                if (actionImages[Number(activeIndex ?? 0)].uniqueName?.toLowerCase().includes("theme")) {
                    // if (!value && themeData) {
                    //     handleMouse(undefined, "theme", { ...themeData["dark"] });
                    // }
                    // else {
                    //     handleMouse(undefined, "theme", { ...themeData["light"] });
                    // }
                    // setValue(!value)
                    const themeKeys = Object.keys(themeData);         // ["dark", "green", "light"]
                    let themeIndex = selectedThemeIndex + 1;

                    if (themeIndex === themeKeys.length) themeIndex = 0;

                    setSeletedThemeIndex(themeIndex);

                    // pick the theme object using the key
                    const selectedTheme = themeData[themeKeys[themeIndex]];

                    // now use it
                    handleMouse(undefined, "theme", selectedTheme);
                    // }

                    const string = camelCase((themeKeys[themeIndex]))
                    setValue(string)
                } else {
                    handleMouse(event, actionImages[Number(activeIndex ?? 0)].actionCode, actionImages[Number(activeIndex ?? 0)].payload)
                }
                setActiveIndex(null);
            }

        }
    };
    useEffect(() => {
        if (imageStripProps.uniqueName === "titlebar") {

            if (imageStripProps.selectedFeature) {
                if (imageStripProps.selectedFeature &&
                    imageStripProps.selectedFeature._Feature &&
                    !imageStripProps.selectedFeature.PopupQa) {
                    setShowAppQa(true)
                } else {
                    setShowAppQa(false)
                }
            } else {
                setShowAppQa(false)
            }
        }
    }, [imageStripProps.selectedFeature])

    useEffect(() => {
        return () => {
            if (hideMenuTimeoutRef.current) {
                clearTimeout(hideMenuTimeoutRef.current);
            }
            if (scrollUpTimeoutRef.current) {
                clearTimeout(scrollUpTimeoutRef.current);
            }
            if (scrollDownTimeoutRef.current) {
                clearTimeout(scrollDownTimeoutRef.current);
            }
            rafIdsRef.current.forEach(id => cancelAnimationFrame(id));
        }
    }, [])

    function handleThemeAppQaClick(event: any, actionCode?: string | undefined, payload?: Record<string, any> | undefined): void {
        // Get the currently selected theme from session storage
        const currentTheme = FnGetSessionStorageItem("selected_theme");
        // Get all available theme keys (e.g. ["dark", "green", "light"])
        const themeKeys = Object.keys(themeData);
        // Find the index of the current theme; default to -1 if not found
        const currentThemeIndex = currentTheme
            ? themeKeys.indexOf(currentTheme.toLowerCase())
            : -1;
        // Move to the next theme and wrap to the beginning when reaching the end.
        // If no valid theme is found, start with index 1 (existing behavior).
        const themeIndex =
            currentThemeIndex >= 0
                ? (currentThemeIndex + 1) % themeKeys.length
                : 1;
        // Update selected theme index state
        setSeletedThemeIndex(themeIndex);
        // Get the next theme configuration
        const selectedTheme = themeData[themeKeys[themeIndex]];
        // Apply the selected theme
        handleMouse(undefined, "theme", selectedTheme);
        // Update the form/control value with the selected theme name
        setValue(camelCase(themeKeys[themeIndex]));
    }
    return (
        <div ref={sidebarRef} className="nz-scroll-image-strip-container">
            <div
                className={imageStripProps.isVertical ? 'nz-scroll-container nz-scroll-container-vertical' : "nz-scroll-container"}
                tabIndex={1}
                onKeyDown={handleKeyDown}
            >
                <div id={"nz-actionimagestrip-container"} style={{
                    display: 'flex',
                    width: imageStripProps.isVertical ? 'auto' : '100%',
                    height: '100%',
                    flexDirection: imageStripProps.isVertical ? 'column' : 'row'
                }}>
                    {/* Menu Action Image display frist in strip */}
                    {imageStripProps.menuActionImage && <div className='nz-menu-action-image-container' >
                        <MenuActionImage
                            data={imageStripProps.menuActionImage}
                        />
                    </div>}

                    <div id={"nz-menu-actionimage"} style={{
                        display: 'flex',
                        width: imageStripProps.isVertical
                            ? width
                            : '100%',
                        height: imageStripProps.isVertical ? '100%' : height,
                        flexDirection: imageStripProps.isVertical ? 'column' : imageStripProps.itemlistAlignNormal ? 'row-reverse' : 'row'
                    }}>


                        {/*  below render action image strip */}
                        {actionImages && actionImages.length ? <div id="nz-actionimages"
                            ref={scrollContainerRef}
                            style={{
                                ...dynamicStyle,
                                display: "flex",
                                overflowX: "auto",
                                scrollBehavior: "smooth",
                                scrollbarWidth: "none",
                                whiteSpace: "nowrap",
                            }} key={imageStripProps.uniqueName}
                            className={`nz-scroll-content nz-image-strip-container${imageStripProps.isVertical ? " nz-strip-vertical" : ""}`}>
                            {imageStripProps.isVertical ? <button ref={topArrowRef} className="nz-top-arrow" onClick={scrollUp}

                            >
                                <div className='nz-top-arrow-div'> &#9665;</div>
                            </button> :
                                // Left Arrow
                                <button
                                    ref={leftArrowRef}
                                    className="nz-arrow left-arrow"
                                    onClick={scrollLeft}
                                >
                                    <div className='nz-left-arrow-div'> &#9665;</div>
                                </button>}


                            {actionImages.map((imageProps: IActionImageForSubMenu, index) => {
                                const showMenu = actionImages.find((item) => item && !item?.PopupQa)



                                return (
                                    <React.Fragment key={index} >
                                        {index === 0 && imageStripProps.isAppQA && showMenu && !showAppQa && <div
                                            className={`nz-image-strip-data  nz-appqa-kebab-button`}
                                            data-kebab-menu="true"
                                            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    setShowAppQa(!showAppQa)
                                                }
                                            }}
                                        >
                                            <ActionImage
                                                image={{
                                                    uniqueName: imageStripProps.uniqueName + "toggle-app-qa-image",
                                                    source: !showAppQa ? <Kebab24x24
                                                        size={FnGetCssVariable('--image-size-2')}
                                                        fill='none'
                                                        strokeWidth={1} /> : <Close24x24
                                                        size={FnGetCssVariable('--image-size-2')}
                                                        fill='none'
                                                        strokeWidth={1} />,
                                                    type: "svg",
                                                    w: "24px",
                                                    h: "24px",
                                                    tooltip: "More"
                                                }}
                                                w="40px"
                                                uniqueName={imageStripProps.uniqueName + "toggle-app-qa-ai"}
                                                actionCode='from'
                                                h="40px"
                                                handleMouse={() => {
                                                    setShowAppQa(!showAppQa)
                                                }}
                                            // handleMouseEnter={() => {
                                            //     setShowAppQa(!showAppQa)
                                            // }}

                                            />
                                        </div>}

                                        <div className={`nz-image-strip-data ${imageStripProps.isAppQA && !imageProps.PopupQa ? "nz-app-qa-strip" : ""} ${imageProps.PopupQa ? 'nz-popup-strip-qa' : ''}`}
                                            style={{
                                                display: imageStripProps.isAppQA ? imageProps.PopupQa ? 'flex' : showAppQa ? 'flex' : 'none' : 'flex',
                                                flexDirection: imageStripProps.isVertical ? "column" : "row",
                                                background: index === activeIndex ? "var(--bg-color-qamenu)" : "transparent",
                                                border: index === activeIndex ? "0.5px solid var(--textprimary)" : "inherit",
                                            }} key={imageProps.uniqueName + index}
                                            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    if (hideMenuTimeoutRef.current && imageStripProps.isAppQA) {
                                                        clearTimeout(hideMenuTimeoutRef.current);
                                                    }
                                                }
                                            }}
                                            draggable={(imageStripProps.allowDND &&
                                                !imageProps.disabled && ((imageProps.payload && isValidPayload(imageProps.payload)) || imageProps.draggable)) ? true : false}
                                            onDrag={(e: React.DragEvent<HTMLDivElement>) => handleDrag(e, imageProps, imageProps.payload)}
                                            onDragEnd={(e: React.DragEvent<HTMLDivElement>) => handleEndDrag(e, imageProps, imageProps.payload)}
                                            onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, imageProps, imageProps.payload)}
                                            onMouseEnter={() => {
                                                if (hideMenuTimeoutRef.current && imageStripProps.isAppQA) {
                                                    clearTimeout(hideMenuTimeoutRef.current);
                                                }
                                            }}
                                            onMouseLeave={(event) => {
                                                if (imageStripProps.isAppQA) {
                                                    hideMenuTimeoutRef.current = setTimeout(() => {
                                                        const relatedTarget = event.relatedTarget as HTMLElement | null;
                                                        // If relatedTarget is null, it might be scrollbar or invalid area — ignore it
                                                        if (!relatedTarget || !(relatedTarget instanceof HTMLElement) || relatedTarget.closest('.nz-app-qa-strip')) {
                                                            return;
                                                        } else if (imageStripProps.selectedFeature) {
                                                            if (imageStripProps.uniqueName === "titlebar" && imageStripProps.selectedFeature.PopupQa) {
                                                                setShowAppQa(false);

                                                            }
                                                            else {
                                                                setShowAppQa(true)
                                                            }
                                                        } else {
                                                            setShowAppQa(false);
                                                        }
                                                    }, 300);
                                                }

                                            }}
                                        >


                                            <React.Fragment key={`${imageProps.uniqueName}-ais-fragment`}>

                                                {
                                                    imageProps.uniqueName && imageProps.uniqueName?.toLowerCase().includes("theme") &&
                                                    <div className='nz-app-qa-theme'>
                                                        <ActionImage
                                                            image={{
                                                                uniqueName: "from",
                                                                source: <ThemeDark24x24
                                                                    size={"22px"}
                                                                    fill='none'
                                                                    strokeWidth={1} />,
                                                                type: "svg",
                                                                w: "var(--image-size-2)",
                                                                h: "var(--image-size-2)",
                                                                tooltip: value + " Theme"
                                                            }}
                                                            {...(!imageStripProps.hideLabel && {
                                                                label: { uniqueName: "L-3", label: "Theme", fontSize: "8px" }
                                                            })}
                                                            w="40px"
                                                            uniqueName='from'
                                                            actionCode='from'
                                                            h="40px"
                                                            handleMouse={handleThemeAppQaClick}
                                                        />
                                                    </div>


                                                }
                                                {imageProps.uniqueName && !imageProps.uniqueName?.toLowerCase().includes("theme") &&
                                                    <ActionImage key={index} {...imageProps} payload={imageProps.payload}
                                                        handleMouse={handleMouse}
                                                        handleMouseEnter={handleMouseEnter}
                                                        handleMouseLeave={handleMouseLeave}
                                                        selected={imageStripProps.uniqueName === "titlebar" ? imageStripProps.selectedFeature && imageStripProps.selectedFeature._Feature?.toString() === imageProps.actionCode.toString() ? true : false
                                                            : imageStripProps.uniqueName === "menu" ? imageStripProps.selectedFeature && imageStripProps.selectedFeature.parentFeatureId && imageStripProps.selectedFeature.parentFeatureId.toString() === imageProps.actionCode.toString() ? true :
                                                                false : imageStripProps.uniqueName === "sidebar-action-image-strip" ? imageStripProps.selectedFeatureQa && (imageStripProps.selectedFeatureQa === imageProps.actionCode || imageStripProps.selectedFeatureQa === imageProps.payload?.Label) ? true : false
                                                                : ((selectedActionCode && selectedActionCode === imageProps.actionCode) || (imageProps.selected && !selectedActionCode)) || undefined} />}


                                            </React.Fragment>
                                            {imageProps.separator && <hr className={imageStripProps.isVertical ? 'nz-image-list-separator' : 'nz-image-list-separator-horizontal'} />}
                                        </div>
                                    </React.Fragment>
                                )
                            })}

                            {imageStripProps.isVertical ?
                                //down arrow
                                <button ref={bottomArrowRef} className="nz-bottom-arrow" onClick={scrollDown}>
                                    <div className='nz-bottom-arrow-div'> &#9665; </div>
                                </button> :
                                // Right Arrow
                                <button
                                    ref={rightArrowRef}
                                    className="nz-arrow right-arrow"
                                    onClick={scrollRight}
                                >
                                    <div className='nz-right-arrow-div'> &#9665; </div>
                                </button>}
                        </div> : <></>}

                        {/*  below render optional component base on condition alignment */}
                        {optionalComponent &&
                            <div
                                id="nz-optionalcomponent"
                                style={{
                                    ...dynamicStyleForOptional,
                                    width: imageStripProps.isVertical ? "100%" : "auto",
                                    flexGrow: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: imageStripProps.itemlistAlignNormal ? "start" : "end",
                                    flexDirection: imageStripProps.isVertical ? "column" : 'unset'
                                }}
                            >

                                {optionalComponent && <OptionalContainer
                                    data={optionalComponent}
                                />}

                            </div>}

                    </div>
                </div>
            </div>
        </div >
    )
}

export { ActionImageStrip };
