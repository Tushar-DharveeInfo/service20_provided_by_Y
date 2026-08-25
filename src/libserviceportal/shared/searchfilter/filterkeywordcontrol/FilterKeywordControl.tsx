
import "./FilterKeywordControl.css";
import { KeyboardEvent } from "react";
import { Filter24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../appcontainer/allcommon/FnGetCssVariable";
import { IDirtyFlagImage } from "../../allinterface/basic/IDirtyFlagImage";
import { DirtyFlagImage } from "../../basic/dirtyflagimage/DirtyFlagImage";
import { EditTextXControl } from "@n20a/libform";

interface IFilterKeywordControl {
    uniqueName: string; // unique name of control
    filterDirty: boolean; // if true then change background color of filter icon
    searchInputValue: string; // search input text
    filterIconTooltip?: string;
    searchValueChange: (value: string) => void; // to pass input value of parent control.
    handleFilterMouse: () => void; // handle mouse event for filter
    onFilterChange?: (keyword: string) => void;
}

function FilterKeywordControl(searchControlProps: IFilterKeywordControl) {
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
      tooltip: searchControlProps.filterIconTooltip ?? "Filter",
    },
    uniqueName: "exporer-filter-image",
    w: 20,
    h: 20,
    bgColor: "#FFFF99",
    allowBorder: false,
  };

  const handleFilterSubmit = () => {
    if (!searchControlProps.searchInputValue?.trim()) {
      return;
    }
    searchControlProps.handleFilterMouse();
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
      moveFocusTo(currentIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocusTo(currentIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveFocusTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveFocusTo(focusableElements.length - 1);
    }
  };

  return (
    <div
      className={`nz-searchControl`}
      key={searchControlProps.uniqueName}
      tabIndex={1}
      onKeyDown={handleContainerKeyDown}
    >
      <div className="nz-search-control">
        <div onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleFilterSubmit();
          }
        }}>
          <EditTextXControl name='search-control' label='' placeholder='Filter' onChange={(value) => {
            searchControlProps.searchValueChange(value)
          }} value={searchControlProps.searchInputValue} />
        </div>
      </div>
      {(searchControlProps.searchInputValue || searchControlProps.filterDirty) && <div className="nz-lens-icon">
        <DirtyFlagImage
          {...filterIcon}
          handleMouse={handleFilterSubmit}
          isDirty={searchControlProps.filterDirty}
          disabled={!searchControlProps.filterDirty}
        />
      </div>}
    </div>
  );
}

export { FilterKeywordControl };
export type { IFilterKeywordControl };