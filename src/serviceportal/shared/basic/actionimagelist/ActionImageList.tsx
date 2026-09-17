
import { Fragment, useEffect, useRef, useState } from 'react'
import { handleContainerKeyDown } from '../../allcommon/basic/FnHandleContainerKeyDown';
import '../../allcss/basic/ActionImageList.css';
import { DefaultStylesActionImageList } from '../../alldefaultprops/basic/DefaultPropsActionImageList.ts';
import { IActionImageForSubMenu, IActionImageList } from '../../allinterface/basic/IActionImageList.ts'
import { ActionImage } from '../actionimage/ActionImage.tsx'

const ActionImageList = (listprops: IActionImageList) => {
    const [actionImages, setActionImages] = useState<IActionImageForSubMenu[]>([]);
    const [selectedActionCode, setSelectedActionCode] = useState<string>();
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const hideMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dynamicStyle = {
        width: (typeof listprops.w === "string" ? listprops.w : `${listprops.w}px`) || DefaultStylesActionImageList.Width,
        height: (typeof listprops.h === "string" ? listprops.h : `${listprops.h}px`) || DefaultStylesActionImageList.Height,
        backgroundColor: listprops.bgColor ? listprops.bgColor : DefaultStylesActionImageList.BGColor,
        border: listprops.border ? listprops.border : DefaultStylesActionImageList.Border,
        padding: listprops.spacing ? listprops.spacing : "0px"
    }
    useEffect(() => {
        if (listprops.actionImages) {
            setActionImages(listprops.actionImages);
        }
    }, [listprops])

    const handleMouseData = (event: any, actionCode?: string, payload?: any) => {
        event.preventDefault();
        event.stopPropagation();
        const selectedActionImage: IActionImageForSubMenu | undefined = actionImages.find((element: IActionImageForSubMenu) => element.actionCode === actionCode);
        setSelectedActionCode(actionCode);
        if (listprops.handleSelect) {
            listprops.handleSelect(selectedActionImage, actionCode, payload)
        }
    }
    const handleDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => {
        listprops.handleDrag && listprops.handleDrag(event, actionCode, payload);
    };


    const handleEndDrag = (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => {

        const clientX: number = event.clientX;
        const clientY: number = event.clientY;
        const DropDiv: HTMLElement | null = document.elementFromPoint(clientX, clientY) as HTMLElement;

        if (!DropDiv) return;

        const attrib = DropDiv.getAttribute("allow-drop");
        if (attrib) {
            listprops.handleEndDrag && listprops.handleEndDrag(event, actionCode, payload);
        }
    }

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, actionCode?: any, payload?: any) => {
        listprops.handleStartDrag && listprops.handleStartDrag(event, actionCode, payload);
    };
    const handleContainerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!actionImages.length) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % actionImages.length);
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            event.preventDefault();
            setActiveIndex((prev) => (prev - 1 + actionImages.length) % actionImages.length);
        } else if (event.key === "Home") {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === "End") {
            event.preventDefault();
            setActiveIndex(actionImages.length - 1);
        } else if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            const selectedItem = actionImages[activeIndex];
            if (selectedItem) {
                handleMouseData(event, selectedItem.actionCode, selectedItem.payload);
            }
        }
    };
    useEffect(() => {
        return () => {
            if (hideMenuTimeoutRef.current) {
                clearTimeout(hideMenuTimeoutRef.current);
                hideMenuTimeoutRef.current = null;
            }
        };
    }, []);
    return (
        <div style={dynamicStyle} className={`nz-image-list-container  nz-list-vertical`} title={listprops.tooltip} key={listprops.uniqueName}
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
            onMouseEnter={() => {
                if (hideMenuTimeoutRef.current) {
                    clearTimeout(hideMenuTimeoutRef.current);
                }
            }}
            onMouseLeave={(event) => {
                hideMenuTimeoutRef.current = setTimeout(() => {
                    const relatedTarget = event.relatedTarget as HTMLElement;
                    // Prevent closing if focus is inside the search filter control
                    if (relatedTarget && relatedTarget?.closest &&
                        (relatedTarget.closest(".nz-menu-search") || relatedTarget.closest(".MuiInputBase-input"))

                    ) {
                        return;
                    } else {
                        event.preventDefault();
                        listprops.handleMoseLeave && listprops.handleMoseLeave();
                    }

                }, 200); // adjust the delay if needed
            }}
        >
            {
                actionImages.length > 0 && actionImages.map((imageProps: IActionImageForSubMenu, index) => (
                    <Fragment key={index}>
                        <div className='nz-image-list-data'
                            style={{ width: "100%", height: '100%' }}
                            key={imageProps.uniqueName + index}
                            onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleMouseData(event, imageProps.actionCode, imageProps.payload);
                                }
                            }}
                            draggable={(listprops.allowDND &&
                                !imageProps.disabled) ? true : false}
                            onDrag={(e: React.DragEvent<HTMLDivElement>) => handleDrag(e, imageProps, imageProps.payload)}
                            onDragEnd={(e: React.DragEvent<HTMLDivElement>) => handleEndDrag(e, imageProps, imageProps.payload)}
                            onDragStart={handleDragStart}

                        >
                            <Fragment key={index}>
                                <ActionImage key={index}  {...imageProps} handleMouse={handleMouseData} selected={((selectedActionCode && selectedActionCode === imageProps.actionCode) || (imageProps.selected && !selectedActionCode)) || undefined} />
                            </Fragment>
                        </div>
                        {imageProps.separator && <hr className='nz-image-list-separator' />}
                    </Fragment>
                ))
            }
        </div >
    )
}

export { ActionImageList }