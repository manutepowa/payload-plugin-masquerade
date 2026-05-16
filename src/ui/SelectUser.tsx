"use client"

import { SelectInput } from "@payloadcms/ui"
import { useRouter } from "next/navigation"
import { use } from "react"

interface Props {
  authCollectionSlug: string
  meId: number | string
  userLabelField: string
  usersPromise: Promise<any>
}

export const SelectUser = ({authCollectionSlug, meId, userLabelField, usersPromise}: Props) => {
  const router = useRouter()
  const { docs } = use(usersPromise)

  return (
      <SelectInput
        name="user"
        onChange={(option) => {
          const selectedValue = (Array.isArray(option) ? option[0]?.value : option?.value) as string || ''
          if (!selectedValue) {
            return
          }

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
        options={[
          {label: 'Select a user', value: ''},
          ...docs.map((user: any) => ({
            label: user[userLabelField] || user.email || user.id,
            value: user.id, // Assuming users have an 'id' field
          })).filter((user: any) => user.value !== meId) // Exclude the current user,
        ]}
        path=""
        placeholder="Select a user to masquerade as"
        style={{ width: '100%', marginBottom: '1rem' }}
      />
  )
}
