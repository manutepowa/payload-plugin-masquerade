import type { PayloadServerReactComponent, SanitizedConfig } from "payload"
import type { CSSProperties } from "react"

import { cookies } from "next/headers"
import { getMasqueradeCookieName } from "../cookies/masqueradeCookie"


const style: CSSProperties | undefined = {
  alignItems: 'center',
  borderBottom: '1px solid var(--theme-elevation-100)',
  display: 'flex',
  height: '30px',
  justifyContent: 'center',
}

export const Unmasquerade: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['header'][0]
> = async (props) => {
  const { user } = props
  const { email } = user
  const appCookies = await cookies()
  const authCollectionSlug =
    ((props as typeof props & { payload?: { config?: SanitizedConfig } }).payload?.config?.custom
      ?.masqueradePlugin as { authCollectionSlug?: string } | undefined)?.authCollectionSlug ||
    (props as typeof props & { payload?: { config?: SanitizedConfig } }).payload?.config?.admin.user ||
    'users'

  if (!appCookies.has(getMasqueradeCookieName())) {return null}

  return (
    <div style={{...style}}>
      <span>You are masquerading with <strong>{ email }</strong></span>{" "}
      <form action={`/api/${authCollectionSlug}/unmasquerade`} method="post" style={{ display: 'inline' }}>
        <button className="admin-action" type="submit">Switch back</button>
      </form>
    </div>
  )
}
