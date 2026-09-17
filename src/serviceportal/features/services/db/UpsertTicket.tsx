import { useBusinessTickets } from '@n20a/libfsdb'
import {YesNoForm} from '@n20a/libform'

const {loading, error, createTicket, updateTicket } = useBusinessTickets('bid_101')

const handleCreateTicket = (ticketId: string) => {
    createTicket(ticketId, {});
}

function CreateTicketComponent({ ticketId }: { ticketId: string }) {
    return (
        <div>
          {!loading && !error && (
            <YesNoForm
            title="Create Ticket"
                message="Are you sure you want to create this ticket?"
                buttonLabels={['Yes', 'No']}
                onButtonClick={(label, index) => {
                    if (label === 'Yes') {
                        handleCreateTicket(ticketId);
                    }
                }}  
            />
          )}

          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}
        </div>
    )
}

const handleUpdateTicket = (ticketId: string) => {
    updateTicket(ticketId, {});
}

function UpdateTicketComponent({ ticketId }: { ticketId: string }) {
    return (
        <div>
          {!loading && !error && (
            <YesNoForm
            title="Update Ticket"
                message="Are you sure you want to update this ticket?"
                buttonLabels={['Yes', 'No']}
                onButtonClick={(label, index) => {
                    if (label === 'Yes') {
                        handleUpdateTicket(ticketId);
                    }
                }}  
            />
          )}

          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}
        </div>
    )
}

export {CreateTicketComponent, UpdateTicketComponent}
