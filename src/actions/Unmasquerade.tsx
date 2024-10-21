import { cookies } from "next/headers"

export const Unmasquerade = async () => {
  const appCookies = await cookies()

  if (!appCookies.has("masquerade")) return null

  const userId = appCookies.get("masquerade")
  return (
    <a
      href={`/api/users/unmasquerade/${userId?.value}`}
      className="admin-action"
    >
      unmasquerade
    </a>
  )
}
