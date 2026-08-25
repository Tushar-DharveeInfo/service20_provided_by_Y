import { useMemo } from 'react'
import { Label } from '../../../../shared/basic/label/Label'
import { IControl } from '../../../../shared/allinterface/settingsform/ISettingsLibForm'
import { SettingsLibForm } from '../../../../shared/settingsform/settingslibform/SettingsLibForm'
import type { ITicketRecord } from './ITicket'
import { FnFormatTicketDate } from '../../../../shared/allcommon/tree/FnFormatTicketDate'

interface ITicketDetailPane {
    uniqueName: string
    ticket: ITicketRecord | null
}

/**
 * Form field names must avoid SettingsLibForm heuristics:
 * - names starting/ending with "date" → forced YYYY-MM-DD
 * - names containing "lastupdated" → app datetime with time
 */
/*
  ticketid: string;
  subscription: string;
  mfg: string;
  eqtype: string;
  prodno: string;
  moreinfo: string;
  status: string;
  daterequested: Date;
  datereleased: Date;
  lastupdated: Date;
*/


const TICKET_FIELD_DEFS: {
    ticketKey: keyof ITicketRecord
    formName: string
    label: string
    displayControl: string
    sortOrder: number
    formatAsDate?: boolean
    editableIfUnlocked?: boolean
}[] = [
        { ticketKey: "Ticket", formName: "Ticket", label: "Ticket", displayControl: "TextControl", sortOrder: 1 },
        { ticketKey: "Status", formName: "Status", label: "Status", displayControl: "TextControl", sortOrder: 2 },
        { ticketKey: "Business", formName: "Business", label: "Business", displayControl: "TextControl", sortOrder: 3 },
        { ticketKey: "Contact", formName: "Contact", label: "Contact", displayControl: "TextControl", sortOrder: 4 },
        { ticketKey: "Email", formName: "Email", label: "Email", displayControl: "TextControl", sortOrder: 5 },
        { ticketKey: "Subscription", formName: "Subscription", label: "Subscription", displayControl: "TextControl", sortOrder: 6 },
        { ticketKey: "Mfg", formName: "Mfg", label: "Mfg", displayControl: "EditTextControl", sortOrder: 7, editableIfUnlocked: true },
        { ticketKey: "EqType", formName: "EqType", label: "Eq Type", displayControl: "EditTextControl", sortOrder: 8, editableIfUnlocked: true },
        { ticketKey: "ProdNo", formName: "ProdNo", label: "Prod No", displayControl: "EditTextControl", sortOrder: 9, editableIfUnlocked: true },
        { ticketKey: "MoreInfo", formName: "MoreInfo", label: "More Info", displayControl: "TextareaControl", sortOrder: 10, editableIfUnlocked: true },
        { ticketKey: "DateRequested", formName: "RequestedOn", label: "Date Requested", displayControl: "TextControl", sortOrder: 11, formatAsDate: true },
        { ticketKey: "DateReleased", formName: "ReleasedOn", label: "Date Released", displayControl: "TextControl", sortOrder: 12, formatAsDate: true },
        { ticketKey: "LastUpdated", formName: "UpdatedOn", label: "Last Updated", displayControl: "TextControl", sortOrder: 13, formatAsDate: true },
    ]

const isStatusLocked = (status?: string | null): boolean => {
    if (!status) return false;
    const normalized = status.trim().toLowerCase();
    return normalized === 'accepted' || normalized === 'closed';
};

function toProfileValue(field: (typeof TICKET_FIELD_DEFS)[number], value: unknown): string {
    if (field.formatAsDate) {
        return FnFormatTicketDate(value as Date | string)
    }
    return value == null ? '' : String(value)
}

function buildTicketControls(status?: string | null): IControl[] {
    const isLocked = isStatusLocked(status);
    return TICKET_FIELD_DEFS.map((field) => {
        const isEditable = !isLocked && Boolean(field.editableIfUnlocked);
        return {
            CanChange: isEditable ? 1 : 0,
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
            DisplayControl: isEditable ? field.displayControl : (field.displayControl === 'TextareaControl' ? 'TextareaControl' : 'TextControl'),
            ChangeEvent: '',
            Secured: false,
            IsNZ: false,
            EntID: field.formName,
            RecID: field.formName,
            LastUpdated: '',
            EntityName: 'Ticket',
            Name: field.formName,
            disabled: !isEditable,
            IsReadOnly: !isEditable,
        };
    });
}

const TicketDetailPane = (ticketDetailPaneProps: ITicketDetailPane) => {
    const { ticket, uniqueName } = ticketDetailPaneProps

    const isLocked = isStatusLocked(ticket?.Status);
    const controls = useMemo(() => buildTicketControls(ticket?.Status), [ticket?.Status]);

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
                key={`${uniqueName}-${ticket.Ticket}-${ticket.ProdNo}-${isLocked ? 'locked' : 'unlocked'}`}
                uniqueName={`${uniqueName}-form`}
                controls={controls}
                profileString={profileString}
                allowShowHeader={true}
                allowShowSectionHeader={true}
                headerText={`${ticket.Ticket} -> ${ticket.ProdNo}`}
                isDisableForm={isLocked}
                isAutoSave={false}
                id={ticket.ProdNo}
            />
        </div>
    )
}

export { TicketDetailPane }
export type { ITicketDetailPane }
