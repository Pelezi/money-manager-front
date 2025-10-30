export function decodeJwt(token: string) {
  try {
    const payloadPart = token.split('.')[1] ?? ''
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)

    const json =
      typeof atob !== 'undefined'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8')

    return JSON.parse(json)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}
