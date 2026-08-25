import { useMemo } from 'react'
import { Label } from '../basic/label/Label'
import { IControl } from '../allinterface/settingsform/ISettingsLibForm'
import { SettingsLibForm } from '../settingsform/settingslibform/SettingsLibForm'
import type { ITicket } from '../allinterface/tree/ITicket'
import { FnFormatTicketDate } from '../allcommon/tree/FnFormatTicketDate'

interface ITicketDetailPane {
    uniqueName: string
    ticket: ITicket | null
}

/**
 * Form field names must avoid SettingsLibForm heuristics:
 * - names starting/ending with "date" → forced YYYY-MM-DD
 * - names containing "lastupdated" → app datetime with time
 */
const TICKET_FIELD_DEFS: {
    ticketKey: keyof ITicket
    formName: string
    label: string
    displayControl: string
    sortOrder: number
    formatAsDate?: boolean
}[] = [
        { ticketKey: 'Ticket', formName: 'Ticket', label: 'Ticket', displayControl: 'TextControl', sortOrder: 1 },
        { ticketKey: 'Status', formName: 'Status', label: 'Status', displayControl: 'TextControl', sortOrder: 2 },
        { ticketKey: 'Business', formName: 'Business', label: 'Business', displayControl: 'TextControl', sortOrder: 3 },
        { ticketKey: 'contact', formName: 'contact', label: 'Contact', displayControl: 'TextControl', sortOrder: 4 },
        { ticketKey: 'Email', formName: 'Email', label: 'Email', displayControl: 'TextControl', sortOrder: 5 },
        { ticketKey: 'subscription', formName: 'subscription', label: 'Subscription', displayControl: 'TextControl', sortOrder: 6 },
        { ticketKey: 'Mfg', formName: 'Mfg', label: 'Mfg', displayControl: 'TextControl', sortOrder: 7 },
        { ticketKey: 'EqType', formName: 'EqType', label: 'Eq Type', displayControl: 'TextControl', sortOrder: 8 },
        { ticketKey: 'ProdNo', formName: 'ProdNo', label: 'Prod No', displayControl: 'TextControl', sortOrder: 9 },
        { ticketKey: 'MoreInfo', formName: 'MoreInfo', label: 'More Info', displayControl: 'TextareaControl', sortOrder: 10 },
        { ticketKey: 'dateRequested', formName: 'RequestedOn', label: 'Date Requested', displayControl: 'TextControl', sortOrder: 11, formatAsDate: true },
        { ticketKey: 'dateReleased', formName: 'ReleasedOn', label: 'Date Released', displayControl: 'TextControl', sortOrder: 12, formatAsDate: true },
        { ticketKey: 'LastUpdated', formName: 'UpdatedOn', label: 'Last Updated', displayControl: 'TextControl', sortOrder: 13, formatAsDate: true },
    ]

function toProfileValue(field: (typeof TICKET_FIELD_DEFS)[number], value: unknown): string {
    if (field.formatAsDate) {
        return FnFormatTicketDate(value as Date | string)
    }
    return value == null ? '' : String(value)
}

function buildTicketControls(): IControl[] {
    return TICKET_FIELD_DEFS.map((field) => ({
        CanChange: 0,
        IsRequired: 0,
        GroupName: 'TicketDetails',
        GroupNameDesc: '',
        SubGroupEntID: '',
        SubGroupName: 'FormControl',
        SubGroupNameDesc: '',
        _AP: field.formName,
        PropertyLabel: field.label,
        NameDesc: field.label,
        DefaultAPValue: '',
        Value: '',
        ValueDesc: '',
        SortOrder: field.sortOrder,
        MaxInstances: 0,
        InputMask: '',
        RegEx: '',
        DisplayGroupControl: 'Ticket Details',
        DisplayControl: field.displayControl,
        ChangeEvent: '',
        Secured: false,
        IsNZ: false,
        EntID: field.formName,
        RecID: field.formName,
        LastUpdated: '',
        EntityName: 'Ticket',
        Name: field.formName,
        disabled: true,
        IsReadOnly: true,
    }))
}

const ticketFormControls = buildTicketControls()

const TicketDetailPane = (ticketDetailPaneProps: ITicketDetailPane) => {
    const { ticket, uniqueName } = ticketDetailPaneProps

    const profileString = useMemo(() => {
        if (!ticket) return ''
        const profile: Record<string, string> = {}
        TICKET_FIELD_DEFS.forEach((field) => {
            profile[field.formName] = toProfileValue(field, ticket[field.ticketKey])
        })
        return JSON.stringify([profile])
    }, [ticket])

    if (!ticket) {
        return (
            <div className="nz-wh-100 nz-d-flex-hv-left" style={{ padding: 'var(--spacing-2)' }}>
                <Label
                    uniqueName={`${uniqueName}-empty`}
                    label="Select a product number to view the ticket."
                />
            </div>
        )
    }

    return (
        <div className="nz-wh-100" style={{ overflow: 'auto' }}>
            <SettingsLibForm
                key={`${uniqueName}-${ticket.Ticket}-${ticket.ProdNo}`}
                uniqueName={`${uniqueName}-form`}
                controls={ticketFormControls}
                profileString={profileString}
                allowShowHeader={true}
                allowShowSectionHeader={true}
                headerText={`${ticket.Ticket} — ${ticket.ProdNo}`}
                isDisableForm={true}
                isAutoSave={false}
                id={ticket.ProdNo}
            />
        </div>
    )
}

export { TicketDetailPane }
export type { ITicketDetailPane }
