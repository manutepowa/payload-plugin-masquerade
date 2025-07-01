import type { PayloadServerReactComponent, SanitizedConfig } from "payload"

import { cookies } from "next/headers"

import { SelectUser } from "./SelectUser"
import { Suspense } from "react"

export const MasqueradeForm: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['beforeNavLinks'][0]
> = async (props) => {
  const cc = await cookies()
  const isMasquerading = cc.get('masquerade')?.value

  const { payload, user: { id: meId } } = props
  const usersPromise = payload.find({
    collection: 'users',
    limit: 0,
  })

  if (isMasquerading) {
    return null // Don't show the form if already masquerading
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelectUser meId={meId} usersPromise={usersPromise} />
    </Suspense>
  )
}
