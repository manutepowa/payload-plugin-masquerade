import type { PayloadServerReactComponent, SanitizedConfig } from "payload"
import type { CSSProperties } from "react"

import { cookies } from "next/headers"


const style: CSSProperties | undefined = {
  alignItems: 'center',
  borderBottom: '1px solid var(--theme-elevation-100)',
  display: 'flex',
  height: '30px',
  justifyContent: 'center',
}

export const Unmasquerade: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['header'][0]
> = async ({ user }) => {
  const { email } = user
  const appCookies = await cookies()

  if (!appCookies.has("masquerade")) {return null}

  const userId = appCookies.get("masquerade")
  return (
    <div style={{...style}}>
      <span>You are masquerading with <strong>{ email }</strong>{" "}
      <a
        className="admin-action"
        href={`/api/users/unmasquerade/${userId?.value}`}
      >
        Switch back
      </a>
      </span>
    </div>
  )
}
