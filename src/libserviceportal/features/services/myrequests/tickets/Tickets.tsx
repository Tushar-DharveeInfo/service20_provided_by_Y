import { useFirestore, type ICreateDocumentRequest, type IUpdateDocumentRequest, type IDeleteDocumentRequest, type IFirestoreWriteResult } from '@n20a/libfsdb';
import { useState, useCallback } from 'react';

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
