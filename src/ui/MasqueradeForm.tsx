import type { PayloadServerReactComponent, SanitizedConfig } from "payload"

import { cookies } from "next/headers"

import { SelectUser } from "./SelectUser"
import { Suspense } from "react"
import { getMasqueradeCookieName } from "../cookies/masqueradeCookie"

export const MasqueradeForm: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['beforeNavLinks'][0]
> = async (props) => {
  const cc = await cookies()
  const isMasquerading = cc.get(getMasqueradeCookieName())?.value

  const { payload, user: { id: meId } } = props
  const pluginConfig = payload.config.custom?.masqueradePlugin as
    | { authCollectionSlug?: string; targetUserWhere?: any; userLabelField?: string }
    | undefined
  const authCollectionSlug = pluginConfig?.authCollectionSlug || payload.config.admin.user || 'users'
  const userLabelField = pluginConfig?.userLabelField || 'email'
  const usersPromise = payload.find({
    collection: authCollectionSlug,
    depth: 0,
    limit: 10,
    page: 1,
    where: pluginConfig?.targetUserWhere,
  })

  if (isMasquerading) {
    return null // Don't show the form if already masquerading
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelectUser
        authCollectionSlug={authCollectionSlug}
        meId={meId}
        userLabelField={userLabelField}
        usersPromise={usersPromise}
      />
    </Suspense>
  )
}
