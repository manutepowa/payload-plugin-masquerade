"use client"
import type { CellComponentProps } from 'payload'
import { useTableCell, useAuth } from "@payloadcms/ui"
import React from "react"

export const MasqueradeCell: React.FC<CellComponentProps> = (props) => {
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

