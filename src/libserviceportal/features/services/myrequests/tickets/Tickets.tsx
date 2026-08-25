import { useFirestore, type IQueryGroupRequest, type ICreateDocumentRequest, type IUpdateDocumentRequest, type IDeleteDocumentRequest, type IFirestoreWriteResult } from '@n20a/libfsdb';
import { useState, useCallback, useRef } from 'react';
import type { ITicket, TicketId, TicketStatus } from './ITicket';
import sampleTicketsJson from '../../../../../serviceSampledata/ticket/sampletickets.json';

function parseDateValue(v: unknown): Date {
    if (!v) return new Date();
    if (v instanceof Date) {
        return isNaN(v.getTime()) ? new Date() : v;
    }
    if (typeof v === 'object' && v !== null) {
        const obj = v as { toDate?: () => Date; seconds?: number; _seconds?: number };
        if (typeof obj.toDate === 'function') {
            try {
                const d = obj.toDate();
                if (!isNaN(d.getTime())) return d;
            } catch {}
        }
        if (typeof obj.seconds === 'number') {
            return new Date(obj.seconds * 1000);
        }
        if (typeof obj._seconds === 'number') {
            return new Date(obj._seconds * 1000);
        }
    }
    if (typeof v === 'number') {
        const d = new Date(v < 1e11 ? v * 1000 : v);
        if (!isNaN(d.getTime())) return d;
    }
    if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed) {
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) return d;
        }
    }
    return new Date();
}

function getField(raw: Record<string, unknown>, ...keys: string[]): unknown {
    for (const key of keys) {
        if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') {
            return raw[key];
        }
    }
    for (const key of keys) {
        const lower = key.toLowerCase();
        for (const [k, v] of Object.entries(raw)) {
            if (k.toLowerCase() === lower && v !== undefined && v !== null && v !== '') {
                return v;
            }
        }
    }
    return undefined;
}

function normalizeTicket(raw: Record<string, unknown>): ITicket {
    const rawDateRequested = getField(raw, 'daterequested', 'DateRequested', 'dateRequested', 'requesteddate', 'RequestedDate', 'date_requested', 'createdat', 'createdAt', 'CreatedAt', 'created_at', 'requestDate', 'RequestDate', 'date', 'Date');
    const rawDateReleased = getField(raw, 'datereleased', 'DateReleased', 'dateReleased', 'releaseddate', 'ReleasedDate', 'date_released', 'releasedDate');
    const rawLastUpdated = getField(raw, 'lastupdated', 'LastUpdated', 'lastUpdated', 'updatedat', 'updatedAt', 'updated_at');

    return {
        ticketid: String(getField(raw, 'ticketid', 'Ticket', 'ticketId', 'TicketId', 'id', 'ID', 'key') || 'T-0'),
        business: String(getField(raw, 'business', 'Business', 'bname', 'company') || ''),
        contact: String(getField(raw, 'contact', 'Contact', 'cname', 'user') || ''),
        email: String(getField(raw, 'email', 'Email', 'useremail') || ''),
        subscription: String(getField(raw, 'subscription', 'Subscription', 'subId') || ''),
        mfg: String(getField(raw, 'mfg', 'Mfg', 'Manufacturer', 'manufacturer') || 'Unknown Mfg'),
        eqtype: String(getField(raw, 'eqtype', 'EqType', 'equipmentType', 'EquipmentType', 'type') || ''),
        prodno: String(getField(raw, 'prodno', 'ProdNo', 'prodNo', 'productNumber', 'ProductNumber', 'name', 'Name') || ''),
        moreinfo: String(getField(raw, 'moreinfo', 'MoreInfo', 'description', 'Description', 'info') || ''),
        status: String(getField(raw, 'status', 'Status') || 'Pending'),
        daterequested: parseDateValue(rawDateRequested),
        datereleased: parseDateValue(rawDateReleased),
        lastupdated: parseDateValue(rawLastUpdated),
    };
}

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
  const [tickets, setTickets] = useState<ITicket[]>([]);
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
