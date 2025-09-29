import pkg from '@pkg' assert { type: 'json' }

const packageJson = pkg as { version?: string }

export const APP_VERSION = packageJson.version ?? '0.0.0'
