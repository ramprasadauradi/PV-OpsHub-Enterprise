import { auth } from '@/lib/auth'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    return <DashboardLayoutClient session={session}>{children}</DashboardLayoutClient>
}
