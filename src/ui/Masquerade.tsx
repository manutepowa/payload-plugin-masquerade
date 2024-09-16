"use client"
import type { CustomComponent } from "payload"
import { useTableCell, useAuth } from "@payloadcms/ui"
import React from "react"

export const MasqueradeCell: React.FC<CustomComponent> = (props) => {
  const {
    rowData: { id: idUser },
  } = useTableCell()
  const { user: loggedInUser } = useAuth()

  return (
    <>
      {loggedInUser?.id !== idUser && (
        <a href={`/api/users/${idUser}/masquerade`}>Masquerade</a>
      )}
    </>
  )
}

export const MasqueradeField: React.FC<CustomComponent> = () => null

