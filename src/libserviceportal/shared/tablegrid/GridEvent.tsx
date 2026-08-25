
import { AppQA } from "../../constants/Feature";
import { FnCopyToClipboard } from "../allcommon/basic/FnCopyToClipboard";
import { IBasicGrid } from "../allinterface/tablegrid/IBasicGrid";
import { CellClickedEvent, CellMouseDownEvent, GridApi, GridReadyEvent, RowClickedEvent } from "ag-grid-community";

const deferGridTask = (task: () => void, delayMs: number): ReturnType<typeof setTimeout> =>
    setTimeout(task, delayMs);

// after rending component this function will call
const onGridReady = (params: GridReadyEvent, props: IBasicGrid) => {


    if (props.containerName === "nz_forcensic_log" && props.featureId) {
        deferGridTask(() => {

            const sidebarContainer: HTMLElement | null = document.querySelector('.nz-qa-sidebar-container');
            if (sidebarContainer) {
                // Select all AG Grids inside the sidebar only
                const gridPanelsInSidebar = sidebarContainer.querySelectorAll('.nz-qa-sidebar-container .ag-paging-panel');

                gridPanelsInSidebar.forEach((panel) => {
                    const recordCount = panel.querySelector('.custom-record-count') as HTMLElement;
                    const summaryPanel = panel.querySelector('.ag-paging-row-summary-panel') as HTMLElement;

                    const width = panel.getBoundingClientRect().width;

                    if (recordCount) {
                        recordCount.style.display = width < 475 ? 'none' : 'inline-block';
                    }
                    if (summaryPanel) {
                        summaryPanel.style.display = width < 375 ? 'none' : 'inline-block';
                    }
                });
            }
        }, 500);

    }


    document.getElementById('gc-app-para')?.classList.remove('hidden');




    const headerElement = document.querySelector('.nz-jsonPropertyGrid .ag-pinned-left-header');
    const addButton = document.querySelector('.nz-swapgrid-addbtn') as HTMLElement | null;
    if (headerElement && addButton) {
        const rect = headerElement.getBoundingClientRect();
        addButton.style.left = `${(rect.right - rect.left) / 2}px`;
    }

    // Ensure all grid containers are visible
    document.querySelectorAll('.nz-ag-container').forEach(el => {
        (el as HTMLDivElement).style.display = 'block';
    });
    deferGridTask(() => {
        hideShowPaginatation(props)
    }, 200);
}


let isHandlingClick = false
// when cell is clicked
const handleMouseEvent = async (event: CellClickedEvent | RowClickedEvent | CellMouseDownEvent, gridRef: any, props: IBasicGrid) => {

    if (event.type === 'cellClicked') {
        if (isHandlingClick) return;
        isHandlingClick = true;
        let pointerEvent = null
        try {

            pointerEvent = event.event;

            const observePopupEditor = () => {
                const popupEditor = document.querySelector(`div[data-key*="${props.uniqueName}"] .ag-popup-editor`) as HTMLDivElement;
                const cellEditor = document.querySelector(`div[data-key*="${props.uniqueName}"] .ag-cell-popup-editing`) as HTMLDivElement;
                const gridBody = document.querySelector(`div[data-key*="${props.uniqueName}"] .ag-root`) as HTMLDivElement;

                if (!popupEditor || !cellEditor || !gridBody) return;

                const rowRect = cellEditor.getBoundingClientRect();
                const gridRect = gridBody.getBoundingClientRect();
                const topOffset = rowRect.top - gridRect.top;

                const computedStyles = window.getComputedStyle(cellEditor);
                const width = computedStyles.width;

                const overridePosition = () => {
                    popupEditor.style.setProperty('top', `calc(${topOffset}px - var(--spacing-0))`, 'important');
                    popupEditor.style.setProperty('width', width, 'important');
                };

                overridePosition();

                const observer = new MutationObserver(() => {
                    overridePosition();
                });

                observer.observe(popupEditor, { attributes: true, attributeFilter: ['style'] });

                deferGridTask(() => observer.disconnect(), 2000);
            };

            deferGridTask(observePopupEditor, 0);
            if (props.handleMouseEvent)
                props.handleMouseEvent(event, gridRef)
            return pointerEvent
        } finally {
            isHandlingClick = false; // reset after a small delay
        }

    }
};


// custom logic for hide pagination and show dynamicaly base on data
const getGridElement = (props: IBasicGrid): HTMLElement | null => {
    const id = props.id ? String(props.id) : `ag-grid-${props.uniqueName}`;
    return document.getElementById(id);
};

const getPaginationPanel = (props: IBasicGrid): HTMLElement | null => {
    const root = getGridElement(props);
    return root?.querySelector('.ag-paging-panel') as HTMLElement | null;
};

const syncPaginationDisplay = (props: IBasicGrid, api: GridApi | null | undefined) => {
    const paginationPanel = getPaginationPanel(props);
    if (!paginationPanel || !api || props.totalRecords == null) {
        return;
    }

    if (props.instanceName !== 'nz_forcensic_log') {
        return;
    }

    const pageSize = api.paginationGetPageSize();
    const currentPage = api.paginationGetCurrentPage();
    const total = Number(props.totalRecords);
    const first = total === 0 ? 0 : currentPage * pageSize + 1;
    let last = (currentPage + 1) * pageSize;
    if (last > total) {
        last = total;
    }
    if (first > total) {
        last = first;
    }

    let recordCountElement = paginationPanel.querySelector('.custom-record-count') as HTMLElement | null;
    if (!recordCountElement) {
        recordCountElement = document.createElement('span');
        recordCountElement.className = 'custom-record-count';
        paginationPanel.insertBefore(recordCountElement, paginationPanel.firstChild);
    }
    recordCountElement.innerText = `Total : ${total}`;

    const summaryPanel = paginationPanel.querySelector('.ag-paging-row-summary-panel') as HTMLElement | null;
    if (summaryPanel && total > 0) {
        summaryPanel.textContent = `${first} to ${last} of ${total}`;
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const lbTotal = paginationPanel.querySelector('[data-ref="lbTotal"]') as HTMLElement | null;
    if (lbTotal) {
        lbTotal.innerText = String(totalPages);
    }
    const lbCurrent = paginationPanel.querySelector('[data-ref="lbCurrent"]') as HTMLElement | null;
    if (lbCurrent) {
        lbCurrent.innerText = String(currentPage + 1);
    }
};

const hideShowPaginatation = (props: IBasicGrid) => {
    const api = props.gridRef?.current?.api as GridApi | undefined;
    syncPaginationDisplay(props, api);

    if (props?.dynamicPagination === true) {
        function hasPagingNumberGreaterThanOne(parentId: string): boolean {
            const parent = document.getElementById(parentId);
            if (!parent) return false;

            const elements = parent.querySelectorAll('.ag-paging-number');
            return Array.from(elements).some((el: any) => {
                const num = parseInt(el.textContent.trim(), 10);
                return !isNaN(num) && num > 1;
            });
        }
        const isShowPagination = hasPagingNumberGreaterThanOne(props.id ? props.id : `ag-grid-${props.uniqueName}`)
        const parent = document.getElementById(props.id ? props.id : `ag-grid-${props.uniqueName}`);
        if (isShowPagination) {
            if (!parent) return false;
            const getPaginationDiv: any = parent.querySelector('.ag-paging-panel')
            if (getPaginationDiv) {
                getPaginationDiv.style.display = 'flex';
            }
        } else {
            if (!parent) return false;
            const getPaginationDiv: any = parent.querySelector('.ag-paging-panel')
            if (getPaginationDiv) {
                getPaginationDiv.style.display = 'none';
            }
        }
    }
};

// Copy data to clipboard
const copyDisplayedColumnsData = (props: IBasicGrid, gridRef: any) => {

    const api =
        props.gridRef?.current?.api ??
        gridRef?.current?.api;

    if (!api) return;

    const displayedColumns = api.getAllDisplayedColumns();
    const dataToCopy: any[] = [];

    api.forEachNodeAfterFilterAndSort((node: any) => {
        // skip group rows if needed
        if (node.group) return;

        const rowData: any = {};

        displayedColumns.forEach((column: any) => {
            const value = api.getCellValue({
                rowNode: node,
                colKey: column.getColId()
            });

            rowData[column.getColDef().headerName] = value;
        });

        dataToCopy.push(rowData);
    });

    if (!dataToCopy.length) {
        console.error("No rows to copy.");
        return;
    }
    const cleanedData = Object.fromEntries(
        Object.entries(dataToCopy).map(([outerKey, innerObj]) => {
            if (innerObj && typeof innerObj === 'object') {
                const cleanedInner = Object.fromEntries(
                    Object.entries(innerObj).filter(
                        ([key]) => key && key.trim() !== ''
                    )
                );
                return [outerKey, cleanedInner];
            }
            return [outerKey, innerObj];
        })
    );
    const jsonData = JSON.stringify(
        cleanedData,
        null,
        2
    );

    FnCopyToClipboard(jsonData, props.exportFileName, props.isExportOnCopy);
};



// widwow resize the it will call
const handleResize = (props: IBasicGrid) => {
    deferGridTask(() => {
        const row: HTMLDivElement | null = document.querySelector(
            ".nz-add-edit-row-dialog .MuiPaper-root"
        );
        if (row) {
            const data: HTMLDivElement | null = document.querySelector(".nz-form-title-bar");
            if (data) {
                row.style.width = data.offsetWidth + "px";
            }
        }
    }, 100);
    const cell: HTMLDivElement | null = props.className
        ? document.querySelector(`.${props.className} .ag-cell-popup-editing`)
        : document.querySelector(`.ag-cell-popup-editing`);
    const popupEditor: HTMLDivElement | null = props.className
        ? document.querySelector(`.${props.className} .ag-popup-editor`)
        : document.querySelector(`.ag-popup-editor`);
    if (popupEditor && cell) {
        popupEditor.style.width = cell.offsetWidth + "px";

    }
    hideShowPaginatation(props);
};

//set popup with of cell
const setWidthPopup = (_props: IBasicGrid) => {
    const spilterPrimary: HTMLDivElement | null = document.querySelector(".nz-form-title-bar");
    if (spilterPrimary) {
        const width = spilterPrimary.offsetWidth;
        const popup: HTMLDivElement | null = document.querySelector(
            ".nz-add-edit-row-dialog .MuiPaper-root"
        );

        if (popup) {
            popup.style.width = width + "px";
        }
    }
};

export { onGridReady, handleMouseEvent, hideShowPaginatation, syncPaginationDisplay, copyDisplayedColumnsData, handleResize, setWidthPopup }