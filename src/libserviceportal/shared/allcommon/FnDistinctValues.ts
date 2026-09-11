import type { IQueryDocumentsRequest, IFirestoreQueryResult } from '@n20a/libfsdb';

/*
//example record for array
export interface ISubDoc {
  purchaser: string;
  subsid: string;
  product: string;
  productkey: string;
}
*/
export function FnDistinctValues<T extends Record<string, unknown>>(
  array: T[],
  keyfield: string
): unknown[] {
  // Return [] when no record contains the requested keyfield.
  const hasKeyInAnyRecord = array.some((item) =>
    Object.prototype.hasOwnProperty.call(item, keyfield)
  );

  if (!hasKeyInAnyRecord) {
    return [];
  }

  const uniqueValues = new Set<unknown>();

  for (const item of array) {
    if (Object.prototype.hasOwnProperty.call(item, keyfield)) {
      uniqueValues.add(item[keyfield]);
    }
  }

  return Array.from(uniqueValues);
}

export function FnActiveSubs<T extends Record<string, unknown>>(
  array: T[]
): T[] {
  return array.filter((item) => item.status === 'active');
}

type SubRecord = Record<string, unknown> & {
  status?: string;
  productkey?: string;
};

export async function FnDistinctProductKeys(
  bid: string,
  queryDocuments: (req: IQueryDocumentsRequest) => Promise<IFirestoreQueryResult>
): Promise<string[]> {
  if (!bid?.trim()) {
    return [];
  }

  try {
    const result = await queryDocuments({
      pathSegments: ['businesses', bid, 'subs'],
    });

    if (!result.success || !result.data) {
      return [];
    }

    const activeSubs = (result.data as SubRecord[]).filter(
      (item) => item.status === 'active'
    );

    return FnDistinctValues(activeSubs, 'productkey').filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    );
  } catch {
    return [];
  }
}
