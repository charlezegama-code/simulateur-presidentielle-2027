import { useEffect, useState } from 'react'
import { loadDataset } from '../data/loader'
import type { Dataset } from '../schema/validate'

export function useDataset(): { dataset: Dataset | null; error: string | null } {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    loadDataset().then(setDataset, (e: Error) => setError(e.message))
  }, [])
  return { dataset, error }
}
