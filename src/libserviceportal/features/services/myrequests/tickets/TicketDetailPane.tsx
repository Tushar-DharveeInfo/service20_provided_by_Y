import { useMemo } from 'react'
import { Label } from '../../../../shared/basic/label/Label'
import { IControl } from '../../../../shared/allinterface/settingsform/ISettingsLibForm'
import { SettingsLibForm } from '../../../../shared/settingsform/settingslibform/SettingsLibForm'
import type { ITicketDoc } from '@n20a/libfsdb'
import { FnFormatTicketDate } from '../../../../shared/allcommon/tree/FnFormatTicketDate'

interface ITicketDetailPane {
    uniqueName: string
    ticket: ITicketDoc | null
    onSaveTicket?: (ticketId: string, updatedFields: Partial<ITicketDoc>) => Promise<void> | void
}

/**
 * Form field names must avoid SettingsLibForm heuristics:
 * - names starting/ending with "date" → forced YYYY-MM-DD
 * - names containing "lastupdated" → app datetime with time
 */

const TICKET_FIELD_DEFS: {
    ticketKey: keyof ITicketDoc
    formName: string
    label: string
    displayControl: string
    sortOrder: number
    formatAsDate?: boolean
    editableIfUnlocked?: boolean
}[] = [
        { ticketKey: "ticketid", formName: "Ticket", label: "Ticket", displayControl: "TextControl", sortOrder: 1 },
        { ticketKey: "status", formName: "Status", label: "Status", displayControl: "TextControl", sortOrder: 2 },
        { ticketKey: "bid", formName: "Business", label: "Business", displayControl: "TextControl", sortOrder: 3 },
        { ticketKey: "cid", formName: "Contact", label: "Contact", displayControl: "TextControl", sortOrder: 4 },
        { ticketKey: "subscription", formName: "Subscription", label: "Subscription", displayControl: "TextControl", sortOrder: 5 },
        { ticketKey: "mfg", formName: "Mfg", label: "Mfg", displayControl: "EditTextControl", sortOrder: 6, editableIfUnlocked: true },
        { ticketKey: "eqtype", formName: "EqType", label: "Eq Type", displayControl: "EditTextControl", sortOrder: 7, editableIfUnlocked: true },
        { ticketKey: "prodno", formName: "ProdNo", label: "Prod No", displayControl: "EditTextControl", sortOrder: 8, editableIfUnlocked: true },
        { ticketKey: "moreinfo", formName: "MoreInfo", label: "More Info", displayControl: "TextareaControl", sortOrder: 9, editableIfUnlocked: true },
        { ticketKey: "daterequested", formName: "RequestedOn", label: "Date Requested", displayControl: "TextControl", sortOrder: 10, formatAsDate: true },
        { ticketKey: "datereleased", formName: "ReleasedOn", label: "Date Released", displayControl: "TextControl", sortOrder: 11, formatAsDate: true },
        { ticketKey: "lastupdated", formName: "UpdatedOn", label: "Last Updated", displayControl: "TextControl", sortOrder: 12, formatAsDate: true },
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
    console.log('ticketDetailPaneProps', ticketDetailPaneProps)
    const { ticket, uniqueName, onSaveTicket } = ticketDetailPaneProps

    const isLocked = isStatusLocked(ticket?.status);
    const controls = useMemo(() => buildTicketControls(ticket?.status), [ticket?.status]);

    const profileString = useMemo(() => {
        if (!ticket) return ''
        const profile: Record<string, string> = {}
        TICKET_FIELD_DEFS.forEach((field) => {
            profile[field.formName] = toProfileValue(field, ticket[field.ticketKey])
        })
        return JSON.stringify([profile])
    }, [ticket])

    const handleSaveForm = (profileDataJson: string, formId?: string) => {
        let parsed: Record<string, unknown> = {}
        try {
            const raw = JSON.parse(profileDataJson)
            parsed = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw
        } catch (e) {
            console.error('Failed to parse profile data', e)
        }

        const ticketId = ticket?.ticketid || (parsed.Ticket as string) || (parsed.ticketid as string) || formId
        if (!ticketId) return

        const updates: Partial<ITicketDoc> = {}
        if (parsed.Mfg !== undefined) updates.mfg = String(parsed.Mfg ?? '').trim()
        else if (parsed.mfg !== undefined) updates.mfg = String(parsed.mfg ?? '').trim()

        if (parsed.EqType !== undefined) updates.eqtype = String(parsed.EqType ?? '').trim()
        else if (parsed.eqtype !== undefined) updates.eqtype = String(parsed.eqtype ?? '').trim()

        if (parsed.ProdNo !== undefined) updates.prodno = String(parsed.ProdNo ?? '').trim()
        else if (parsed.prodno !== undefined) updates.prodno = String(parsed.prodno ?? '').trim()

        if (parsed.MoreInfo !== undefined) updates.moreinfo = String(parsed.MoreInfo ?? '').trim()
        else if (parsed.moreinfo !== undefined) updates.moreinfo = String(parsed.moreinfo ?? '').trim()

        void onSaveTicket?.(ticketId, updates)
    }

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

    const formId = ticket.ticketid || ticket.prodno || 'ticket';

    return (
        <div className="nz-wh-100" style={{ overflow: 'auto' }}>
            <SettingsLibForm
                key={`${uniqueName}-${ticket.ticketid || 'ticket'}-${ticket.lastupdated || ticket.prodno || 'initial'}-${isLocked ? 'locked' : 'unlocked'}`}
                uniqueName={`${uniqueName}-form`}
                controls={controls}
                profileString={profileString}
                allowShowHeader={true}
                allowShowSectionHeader={true}
                headerText={`${ticket.ticketid || 'Ticket'} -> ${ticket.prodno || 'No Product Number'}`}
                isDisableForm={isLocked}
                isAutoSave={false}
                id={formId}
                handleSaveForm={handleSaveForm}
            />
        </div>
    )
}

export { TicketDetailPane }
export type { ITicketDetailPane }
