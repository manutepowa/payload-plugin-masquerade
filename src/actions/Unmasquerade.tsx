import { cookies } from "next/headers"
import { PayloadServerReactComponent, SanitizedConfig } from "payload"
import { CSSProperties } from "react"

const style: CSSProperties | undefined = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '30px',
  borderBottom: '1px solid var(--theme-elevation-100)',
}

export const Unmasquerade: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['header'][0]
> = async ({ user }) => {
  const { email } = user
  const appCookies = await cookies()

  if (!appCookies.has("masquerade")) return null

  const userId = appCookies.get("masquerade")
  return (
    <div style={{...style}}>
      <span>You are masquerading with <strong>{ email }</strong>{" "}
      <a
        href={`/api/users/unmasquerade/${userId?.value}`}
        className="admin-action"
      >
        Switch back
      </a>
      </span>
    </div>
  )
}
