"use client"
import type { CellComponentProps } from 'payload'
import { useTableCell, useAuth } from "@payloadcms/ui"
import React from "react"

export const MasqueradeCell: React.FC<CellComponentProps> = (props) => {
  const {
    rowData,
  } = useTableCell()
  const { user: loggedInUser } = useAuth()

  console.log({ rowData, loggedInUser })

  const idUser = "asd"
  return (
    <>
      {loggedInUser?.id !== idUser && (
        <a href={`/api/users/${idUser}/masquerade`}>Masqueradee</a>
      )}
    </>
  )
}

