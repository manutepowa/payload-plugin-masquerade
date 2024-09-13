import React from "react"
import { cookies } from "next/headers"

export default function Unmasquerade() {
  if (!cookies().has("masquerade")) return null

  const userId = cookies().get("masquerade")
  return (
    <a
      href={`/api/users/unmasquerade/${userId?.value}`}
      className="admin-action"
    >
      unmasquerade
    </a>
  )
}
