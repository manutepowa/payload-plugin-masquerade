"use client"

import { SelectInput } from "@payloadcms/ui"
import { useRouter } from "next/navigation.js"
import { use } from "react"

interface Props {
  meId: number | string
  usersPromise: Promise<any>
}

export const SelectUser = ({meId, usersPromise}: Props) => {
  const router = useRouter()
  const { docs } = use(usersPromise)

  return (
      <SelectInput
        name="user"
        onChange={(option) => {
          const selectedValue = (Array.isArray(option) ? option[0]?.value : option?.value) as string || ''
          // setValue(selectedValue)
          // /api/users/${idUser}/masquerade
          router.push(`/api/users/${selectedValue}/masquerade`)
        }}
        options={[
          {label: 'Select a user', value: ''},
          ...docs.map((user: any) => ({
            label: user.email || user.id, // Assuming users have an 'email' field
            value: user.id, // Assuming users have an 'id' field
          })).filter((user: any) => user.value !== meId) // Exclude the current user,
        ]}
        path=""
        placeholder="Select a user to masquerade as"
        style={{ width: '100%', marginBottom: '1rem' }}
      />
  )
}
