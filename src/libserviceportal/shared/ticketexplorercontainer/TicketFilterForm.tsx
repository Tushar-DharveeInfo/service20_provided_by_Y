import { Close24x24, Filter24x24 } from '@n20a/libicon'
import { YesNoControl } from '@n20a/libform'
import '@n20a/libform/index.css'
import { IDirtyFlagImage } from '../allinterface/basic/IDirtyFlagImage'
import { FnGetCssVariable } from '../../appcontainer/allcommon/FnGetCssVariable'
import { Label } from '../basic/label/Label'
import { ActionImage } from '../basic/actionimage/ActionImage'
import { DirtyFlagImage } from '../basic/dirtyflagimage/DirtyFlagImage'

export interface ITicketFilterValues {
    /** When true show all tickets; when false show Pending only. */
    showAll: boolean
    /** When true: Mfg → ProdNo. When false: DateRequested → Mfg → ProdNo. */
    byMfg: boolean
}

interface ITicketFilterForm {
    uniqueName: string
    headerText?: string
    isFilterChange?: boolean
    filterValues: ITicketFilterValues
    handleFilterChange: (values: ITicketFilterValues) => void
    handleActionImageClick: (
        event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
        actionCode?: string
    ) => void
}

const TicketFilterForm = (ticketFilterFormProps: ITicketFilterForm) => {
    const { filterValues, handleFilterChange } = ticketFilterFormProps

    const filterIcon: IDirtyFlagImage = {
        image: {
            w: 'var(--image-size-2)',
            h: 'var(--image-size-2)',
            uniqueName: 'ticket-filtericon',
            source: (
                <Filter24x24
                    size={FnGetCssVariable('--image-size-2')}
                    fill="none"
                    strokeWidth={1}
                />
            ),
            type: 'svg',
            tooltip: 'Apply filter',
        },
        uniqueName: 'ticket-filter-dirty',
        w: 'var(--node_height)',
        h: 'var(--node_height)',
        bgColor: '#FFFF99',
        allowBorder: false,
    }

    return (
        <div className="nz-filter-form-container" tabIndex={1}>
            <div className="nz-sub-header">
                <Label
                    uniqueName={`${ticketFilterFormProps.uniqueName}-fheader`}
                    label={ticketFilterFormProps.headerText || 'Filter Tickets'}
                />
                <div className="nz-d-flex-row" style={{ gap: 'var(--spacing-1)' }}>
                    <ActionImage
                        uniqueName={`${ticketFilterFormProps.uniqueName}-close-ai`}
                        image={{
                            uniqueName: `${ticketFilterFormProps.uniqueName}-close-image`,
                            source: (
                                <Close24x24
                                    size={FnGetCssVariable('--image-size-2')}
                                    fill="none"
                                    strokeWidth={1}
                                />
                            ),
                            w: 'var(--image-size-2)',
                            tooltip: 'Cancel',
                            type: 'svg',
                        }}
                        w={'var(--node_height)'}
                        h={'var(--node_height)'}
                        actionCode="close"
                        handleMouse={(event) => {
                            ticketFilterFormProps.handleActionImageClick?.(event, 'close')
                        }}
                    />
                    {ticketFilterFormProps.isFilterChange && (
                        <div className="nz-filter-icon">
                            <DirtyFlagImage
                                {...filterIcon}
                                handleMouse={(event) => {
                                    ticketFilterFormProps.handleActionImageClick?.(event, 'apply')
                                }}
                                isDirty={!!ticketFilterFormProps.isFilterChange}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="nz-filter-form-content">
                <div className="nz-d-flex-column" style={{ gap: 'var(--spacing-2)', padding: 'var(--spacing-2)' }}>
                    <label className="nz-d-flex-row nz-align-center" style={{ gap: 8 }}>
                        <YesNoControl
                            name={`${ticketFilterFormProps.uniqueName}-showAll`}
                            value={filterValues.showAll}
                            onChange={(checked) => {
                                handleFilterChange({ ...filterValues, showAll: !!checked })
                            }}
                        />
                        <span>All</span>
                    </label>
                    <label className="nz-d-flex-row nz-align-center" style={{ gap: 8 }}>
                        <YesNoControl
                            name={`${ticketFilterFormProps.uniqueName}-byMfg`}
                            value={filterValues.byMfg}
                            onChange={(checked) => {
                                handleFilterChange({ ...filterValues, byMfg: !!checked })
                            }}
                        />
                        <span>By Mfg</span>
                        <span style={{ opacity: 0.7, fontSize: '0.85em' }}>
                            {filterValues.byMfg ? '(Mfg → ProdNo)' : '(DateRequested → Mfg → ProdNo)'}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    )
}

export { TicketFilterForm }
export type { ITicketFilterForm }
