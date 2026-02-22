import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Home() {
    const session = await auth()
    if (!session?.user) {
        redirect('/login')
    }
    const role = session.user.role
    if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') {
        redirect('/admin/users')
    }
    if (role === 'PROJECT_MANAGER' || role === 'QUALITY_MANAGER' || role === 'OPS_MANAGER') {
        redirect('/dashboard/manager')
    }
    if (role === 'TEAM_LEAD') {
        redirect('/dashboard/tl')
    }
    if (role === 'PROCESSOR') {
        redirect('/dashboard/project')
    }
    redirect('/dashboard/tl')
}
