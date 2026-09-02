import { useFirestore, type IQueryGroupRequest, type ICreateDocumentRequest, type IUpdateDocumentRequest, type IDeleteDocumentRequest, type IFirestoreWriteResult } from '@n20a/libfsdb';
import { useState, useCallback, useRef } from 'react';
import type { ITicketRecord } from './ITicket';
import sampleTicketsJson from '../../../../../serviceSampledata/ticket/sampletickets.json';
import { FnNormalizeTicket } from './FnNormalizeTicket';

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
    const fallbackTickets = (sampleTicketsJson as Record<string, unknown>[]).map((row) => FnNormalizeTicket(row));
    try {
      console.log('Fetching tickets with request:', ticketRequest);
      const result = await queryDocumentsGroup(ticketRequest);
      if (requestId !== fetchIdRef.current) return undefined; // discard stale response
      if (!result.success) {
        console.warn('Firestore tickets query returned unauthenticated / error, using sample data:', result.error);
        setTickets(fallbackTickets);
        setError(null);
        return fallbackTickets;
      }
      const loadedTickets = (result.data ?? []).map((row) => FnNormalizeTicket(row));
      const ticketsToUse = loadedTickets.length > 0 ? loadedTickets : fallbackTickets;
      setTickets(ticketsToUse);
      console.log('Fetched tickets:', result.data);
      return ticketsToUse;
    } catch (err) {
      if (requestId !== fetchIdRef.current) return undefined;
      console.warn('Firestore tickets error, using sample data:', err);
      setTickets(fallbackTickets);
      setError(null);
      return fallbackTickets;
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
