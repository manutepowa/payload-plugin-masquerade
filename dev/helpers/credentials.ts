export const devUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

export const devUsers = [
  devUser,
  ...Array.from({ length: 49 }, (_, i) => ({
    email: `user${String(i + 1).padStart(2, '0')}@payloadcms.com`,
    password: 'test',
  })),
]
