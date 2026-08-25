
import { KeyboardEvent, useState } from 'react'
import './SearchControl.css'
import { Filter24x24, Lens24x24 } from '@n20a/libicon'
import { FnGetCssVariable } from '../../../appcontainer/allcommon/FnGetCssVariable'
import { IDirtyFlagImage } from '../../allinterface/basic/IDirtyFlagImage'
import { DirtyFlagImage } from '../../basic/dirtyflagimage/DirtyFlagImage'
import { OptionToggle } from '../../basic/optiontoggle/OptionToggle'
import { IOptionToggle } from '../../allinterface/basic/IOptionToggle'
import { EditTextXControl } from '@n20a/libform'

interface ISearchControl {
    uniqueName: string; // unique name of control
    isShowFilterControl: boolean; // if true then display filter icon
    hideRightMouseMenu: boolean; // if true then hide right mouse menu
    lensDirty: boolean; // if true then change background color of lens icon
    filterDirty: boolean; // if true then change background color of filter icon
    searchInputValue: string; // search input text
    hideSearchControl?: boolean; // if true then hide search control
    isDisableSearch?: boolean;
    filterIconTooltip?: string;
    searchValueChange: (value: string) => void; // to pass input value of parent control.
    handleFilterMouse: () => void; // handle mouse event for filter
    handleLensMouse: (selectedCondion: "AND" | string) => void; // handle mouse event for lens
}

function SearchControl(searchControlProps: ISearchControl) {
    const [selectedItem, setSelectedItem] = useState<string>('')
    const filterIcon: IDirtyFlagImage = {
        image: {
            w: 'var(--image-size-2)',
            h: 'var(--image-size-2)',
            uniqueName: "filtericon",
            source: <Filter24x24
                size={FnGetCssVariable('--image-size-2')}
                fill='none'
                strokeWidth={1} />,
            type: "svg",
            tooltip: searchControlProps.filterIconTooltip ?? "Filter"

        },
        uniqueName: 'test-image',
        w: 'var(--node_height)',
        h: 'var(--node_height)',
        bgColor: "#FFFF99",
        allowBorder: false,
    }
    const rightMouseMenuToggleData: IOptionToggle = {
        container: "searchControl",
        showIcon: true,
        featureId: '256',
        uniqueName: 'test-rtm',
        handleSelect(value: string) { },
    }

    const lensIcon: IDirtyFlagImage = {
        image: {
            w: 'var(--image-size-2)',
            h: 'var(--image-size-2)',
            uniqueName: "filtericon",
            source: <Lens24x24
                size={FnGetCssVariable('--image-size-2')}
                fill='none'
                strokeWidth={1} />,
            type: "svg",
            tooltip: "Search or Search Next"
        },
        uniqueName: 'test-image',
        w: 'var(--node_height)',
        h: 'var(--node_height)',
        bgColor: "#FFFF99",
        allowBorder: false,
    }


    const handleselect = (selectedValue: string) => {
        setSelectedItem(selectedValue)
    }

    const handleSearchSubmit = () => {
        searchControlProps.handleLensMouse(selectedItem);
    };

    const handleContainerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const container = event.currentTarget;
        const focusableElements = Array.from(
            container.querySelectorAll<HTMLElement>(
                'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
            )
        ).filter((element) => element.offsetParent !== null);

        if (!focusableElements.length) {
            return;
        }

        const activeIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        const currentIndex = activeIndex >= 0 ? activeIndex : 0;
        const moveFocusTo = (index: number) => {
            const bounded = Math.max(0, Math.min(index, focusableElements.length - 1));
            focusableElements[bounded]?.focus();
        };

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            moveFocusTo(currentIndex + 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            moveFocusTo(currentIndex - 1);
        } else if (event.key === 'Home') {
            event.preventDefault();
            event.stopPropagation();
            moveFocusTo(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            event.stopPropagation();
            moveFocusTo(focusableElements.length - 1);
        }
    };

    return (
        <div
            className={`nz-searchControl ${!searchControlProps.isShowFilterControl ? 'nz-hidefilter-icon' : ''}`}
            key={searchControlProps.uniqueName}
            tabIndex={1}
            onKeyDown={handleContainerKeyDown}
        >
            {searchControlProps.isShowFilterControl &&
                <div className='nz-filter-icon'>
                    <DirtyFlagImage {...filterIcon} handleMouse={searchControlProps.handleFilterMouse} isDirty={searchControlProps.filterDirty} />
                </div>}
            {!searchControlProps.hideRightMouseMenu &&
                <div>
                    <OptionToggle  {...rightMouseMenuToggleData}
                        handleSelect={handleselect} />
                </div>}
            {!searchControlProps.hideSearchControl &&
                <>
                    <div className='nz-search-control'>
                        <div onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                handleSearchSubmit();
                            }
                        }}>
                            <EditTextXControl name='search-control' label='' placeholder='Search' onChange={(value) => {
                                searchControlProps.searchValueChange(value)
                            }} value={searchControlProps.searchInputValue} />
                        </div>
                    </div>
                    {(searchControlProps.searchInputValue || searchControlProps.lensDirty) && <div className='nz-lens-icon'>
                        <DirtyFlagImage {...lensIcon} handleMouse={handleSearchSubmit} isDirty={searchControlProps.lensDirty} disabled={!searchControlProps.lensDirty} />
                    </div>}
                </>
            }

        </div>
    )
}

export { SearchControl };
export type { ISearchControl };
