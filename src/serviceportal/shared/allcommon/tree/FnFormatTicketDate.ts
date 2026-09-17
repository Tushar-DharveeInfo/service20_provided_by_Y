import { FnFormatDateWithAppFormat } from '../../../appcontainer/allcommon/FnFormatDateWithAppFormat'


/** Ticket date + time (MM/dd/yyyy h:mm AM/PM). Used in detail form. */
function FnFormatTicketDate(value: Date | string | null | undefined): string {
    if (value == null || value === '') return ''
    return FnFormatDateWithAppFormat(value, true)
}

/** Ticket date only (MM/dd/yyyy). Used for tree day group labels. */
function FnFormatTicketDateOnly(value: Date | string | null | undefined): string {
    if (value == null || value === '') return ''
    return FnFormatDateWithAppFormat(value, false)
}
export { FnFormatTicketDate, FnFormatTicketDateOnly }