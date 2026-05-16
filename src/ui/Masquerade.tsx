"use client"
import type { DefaultCellComponentProps } from "payload"

import { useAuth } from "@payloadcms/ui"
import React from "react"

export const MasqueradeCell: React.FC<DefaultCellComponentProps> = (props) => {
  const { rowData: { id: idUser } } = props
  const { user: loggedInUser } = useAuth()
  const collectionSlug = (props as DefaultCellComponentProps & { collectionSlug?: string }).collectionSlug || 'users'

  return (
    <>
      {loggedInUser?.id !== idUser && (
        <form action={`/api/${collectionSlug}/${idUser}/masquerade`} method="post">
          <button className="btn btn--style-none" type="submit">Masquerade</button>
        </form>
      )}
    </>
  )
}
