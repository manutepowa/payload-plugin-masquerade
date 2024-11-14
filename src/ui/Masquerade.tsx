"use client"
import { useAuth } from "@payloadcms/ui"
import { DefaultCellComponentProps } from "payload"
import React from "react"

export const MasqueradeCell: React.FC<DefaultCellComponentProps> = (props) => {
  const { rowData: { id: idUser } } = props
  const { user: loggedInUser } = useAuth()

  return (
    <>
      {loggedInUser?.id !== idUser && (
        <a href={`/api/users/${idUser}/masquerade`}>Masquerade</a>
      )}
    </>
  )
}

