import path from 'path'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { en as adminLanguage } from '@payloadcms/translations/languages/en'
import { fileURLToPath } from 'url'
import { Admins } from './collections/Admins'
import { Media } from './collections/Media'
import { Folders } from './collections/Folders'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { TherapistProfiles } from './collections/TherapistProfiles'
import { Bookings } from './collections/Bookings'
import { ChatConversations } from './collections/ChatConversations'
import { ChatMessages } from './collections/ChatMessages'
import { ClientFeedback } from './collections/ClientFeedback'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.PAYLOAD_SECRET) {
  throw new Error('PAYLOAD_SECRET environment variable is required')
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    // Payload хүснэгтүүдийг Node серверийн public.users / psychologists-ээс тусгаарлана
    schemaName: 'payload',
  }),
  admin: {
    user: Admins.slug,
    constrainWidth: true,
    dashboard: {
      widgets: [],
      defaultLayout: [
        { widgetSlug: 'activity', width: 'full' },
        { widgetSlug: 'collections', width: 'full' },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    fallbackLanguage: 'en',
    supportedLanguages: { 'en': adminLanguage },
  },
  collections: [
    Admins,
    Users,
    TherapistProfiles,
    Bookings,
    ChatConversations,
    ChatMessages,
    ClientFeedback,
    Media,
    Folders,
    Tags,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    locales: [{ code: 'en', label: 'English' }],
    fallback: true,
    defaultLocale: 'en',
  },
  plugins: [mcpPlugin({})],
})
