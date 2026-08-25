import { useFirestore, type IQueryGroupRequest, type ICreateDocumentRequest, type IUpdateDocumentRequest, type IDeleteDocumentRequest, type IFirestoreWriteResult } from '@n20a/libfsdb';
import { useState, useCallback, useRef } from 'react';
import type { ITicketRecord, TicketId, TicketStatus } from './ITicket';
import sampleTicketsJson from '../../../../../serviceSampledata/ticket/sampletickets.json';

const normalizeTicket = (data: Record<string, unknown>): ITicketRecord => ({
  Business: String(data.Business ?? ""),
  Contact: String(data.Contact ?? ""),
  Email: String(data.Email ?? ""),
  Subscription: String(data.Subscription ?? ""),
  Ticket: String(data.Ticket ?? "") as TicketId,
  Mfg: String(data.Mfg ?? ""),
  EqType: String(data.EqType ?? ""),
  ProdNo: String(data.ProdNo ?? ""),
  MoreInfo: String(data.MoreInfo ?? ""),
  Status: String(data.Status ?? "Pending") as TicketStatus,
  DateRequested: new Date(String(data.DateRequested ?? "")),
  DateReleased: new Date(String(data.DateReleased ?? "")),
  LastUpdated: new Date(String(data.LastUpdated ?? "")),
});

/*
Usage in a component under FirestoreProvider:
import { useTickets } from '../libserviceportal';

function MyComponent() {
  const { tickets, error, loading, fetchTickets } = useTickets();

  useEffect(() => {
    fetchTickets({
      collectionPath: 'tickets',
      filters: [{ field: 'status', op: '==', value: 'open' }],
    });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p>Error: {error}</p>;

  return <ul>{tickets?.documents.map(doc => <li key={doc.id}>{doc.id}</li>)}</ul>;
}
*/
export function useFetchTickets() {
  const { queryDocumentsGroup } = useFirestore();
  const [tickets, setTickets] = useState<ITicketRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchTickets = useCallback(async (ticketRequest: IQueryGroupRequest) => {
    const requestId = ++fetchIdRef.current;
    setError(null);
    setLoading(true);
    try {
      console.log('Fetching tickets with request:', ticketRequest);
      const result = await queryDocumentsGroup(ticketRequest);
      if (requestId !== fetchIdRef.current) return; // discard stale response
      if (!result.success) {
        console.warn('Firestore tickets query returned unauthenticated / error, using sample data:', result.error);
        const fallbackTickets = (sampleTicketsJson as Record<string, unknown>[]).map(normalizeTicket);
        setTickets(fallbackTickets);
        setError(null);
      } else {
        const loadedTickets = (result.data ?? []).map(normalizeTicket);
        setTickets(loadedTickets.length > 0 ? loadedTickets : (sampleTicketsJson as Record<string, unknown>[]).map(normalizeTicket));
        console.log('Fetched tickets:', result.data);
      }
    } catch (err) {
      if (requestId !== fetchIdRef.current) return;
      console.warn('Firestore tickets error, using sample data:', err);
      const fallbackTickets = (sampleTicketsJson as Record<string, unknown>[]).map(normalizeTicket);
      setTickets(fallbackTickets);
      setError(null);
    } finally {
      if (requestId === fetchIdRef.current) setLoading(false);
    }
  }, [queryDocumentsGroup]);

  return { tickets, error, loading, fetchTickets };
}

export function useCreateTicket() {
  const { createDocument } = useFirestore();
  const [result, setResult] = useState<IFirestoreWriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createTicket = useCallback(async (request: ICreateDocumentRequest) => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await createDocument(request);
      if (!res.success) {
        setError(`${res.error ?? ''}${res.details ? ` | details: ${res.details}` : ''}`);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [createDocument]);

  return { result, error, loading, createTicket };
}

export function useUpdateTicket() {
  const { updateDocument } = useFirestore();
  const [result, setResult] = useState<IFirestoreWriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateTicket = useCallback(async (request: IUpdateDocumentRequest) => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await updateDocument(request);
      if (!res.success) {
        setError(`${res.error ?? ''}${res.details ? ` | details: ${res.details}` : ''}`);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [updateDocument]);

  return { result, error, loading, updateTicket };
}

export function useDeleteTicket() {
  const { deleteDocument } = useFirestore();
  const [result, setResult] = useState<IFirestoreWriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deleteTicket = useCallback(async (request: IDeleteDocumentRequest) => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await deleteDocument(request);
      if (!res.success) {
        setError(`${res.error ?? ''}${res.details ? ` | details: ${res.details}` : ''}`);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [deleteDocument]);

  return { result, error, loading, deleteTicket };
}
