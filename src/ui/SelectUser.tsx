"use client"

import { ReactSelect } from "@payloadcms/ui"
import { useRouter } from "next/navigation"
import { use, useCallback, useEffect, useRef, useState } from "react"

interface Props {
  authCollectionSlug: string
  meId: number | string
  userLabelField: string
  usersPromise: Promise<any>
}

const LIMIT = 10
const DEBOUNCE_MS = 300

export const SelectUser = ({ authCollectionSlug, meId, userLabelField, usersPromise }: Props) => {
  const router = useRouter()
  const initial = use(usersPromise)

  const [docs, setDocs] = useState<any[]>(initial.docs)
  const [page, setPage] = useState(initial.page)
  const [totalPages, setTotalPages] = useState(initial.totalPages)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fetchingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchPage = useCallback(
    async (pageNum: number, searchTerm: string, append: boolean) => {
      if (fetchingRef.current) return
      fetchingRef.current = true
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(pageNum))
        params.set('limit', String(LIMIT))
        if (searchTerm) params.set('search', searchTerm)

        const res = await fetch(`/api/${authCollectionSlug}/masquerade-search?${params}`)
        if (!res.ok) return
        const data = await res.json()

        setDocs((prev) => (append ? [...prev, ...data.docs] : data.docs))
        setPage(data.page)
        setTotalPages(data.totalPages)
      } finally {
        fetchingRef.current = false
        setIsLoading(false)
      }
    },
    [authCollectionSlug],
  )

  const handleInputChange = useCallback(
    (val: string) => {
      setSearch(val)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void fetchPage(1, val, false)
      }, DEBOUNCE_MS)
    },
    [fetchPage],
  )

  const handleMenuScrollToBottom = useCallback(() => {
    if (page < totalPages && !isLoading) {
      void fetchPage(page + 1, search, true)
    }
  }, [page, totalPages, isLoading, search, fetchPage])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const options = docs
    .filter((user: any) => String(user.id) !== String(meId))
    .map((user: any) => ({
      label: user[userLabelField] || user.email || String(user.id),
      value: String(user.id),
    }))

  return (
    <div style={{ width: '100%', marginBottom: '1rem' }}>
      <ReactSelect
        onChange={(option) => {
          const selectedValue = (
            Array.isArray(option) ? option[0]?.value : option?.value
          ) as string || ''
          if (!selectedValue) return

          void fetch(`/api/${authCollectionSlug}/${selectedValue}/masquerade`, {
            method: 'POST',
          }).then((response) => {
            if (response.redirected) {
              window.location.assign(response.url)
              return
            }

            router.refresh()
          })
        }}
        onInputChange={handleInputChange}
        onMenuScrollToBottom={handleMenuScrollToBottom}
        options={options}
        isLoading={isLoading}
        isSearchable
        filterOption={() => true}
        placeholder="Select a user to masquerade as"
      />
    </div>
  )
}
