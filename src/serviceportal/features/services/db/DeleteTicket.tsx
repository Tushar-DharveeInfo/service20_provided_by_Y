import { useBusinessTickets } from '@n20a/libfsdb'
import {YesNoForm} from '@n20a/libform'

const {loading, error, deleteTicket } = useBusinessTickets('bid_101')

const handleDeleteTicket = (ticketId: string) => {
    deleteTicket(ticketId);
}

function DeleteTicketComponent({ ticketId }: { ticketId: string }) {
    return (
        <div>
          {!loading && !error && (
            <YesNoForm
            title="Delete Ticket"
                message="Are you sure you want to delete this ticket?"
                buttonLabels={['Yes', 'No']}
                onButtonClick={(label, index) => {
                    if (label === 'Yes') {
                        handleDeleteTicket(ticketId);
                    }
                }}  
            />
          )}

          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}
        </div>
    )
}

export default DeleteTicketComponent
