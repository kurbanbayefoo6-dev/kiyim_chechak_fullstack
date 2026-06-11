import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { useAuthContext } from '@/contexts/AuthContext'
import { SidebarNav, buildDefaultNavItems } from '@/components/layout/SidebarNav'
import { Button } from '@/components/common/Button'

const brand = {
  name: 'Retake chechak',
  tagline: 'Wholesale ERP • CRM • WMS',
}

export function AppShell() {
  const { user, logout } = useAuthContext()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = useMemo(() => buildDefaultNavItems(), [])

  const currentTitle = useMemo(() => {
    const path = location.pathname
    if (path.startsWith(ROUTES.dashboard)) return 'Dashboard'
    if (path.startsWith(ROUTES.customers)) return 'Customers'
    if (path.startsWith(ROUTES.inventory)) return 'Inventory'
    if (path.startsWith(ROUTES.orders)) return 'Orders'
    if (path.startsWith(ROUTES.warehouse)) return 'Warehouse'
    if (path.startsWith(ROUTES.reports)) return 'Reports'
    return 'Dashboard'
  }, [location.pathname])

  const onLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/5 p-5 md:block">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-emerald-700/20 ring-1 ring-brand-emerald-700/40" />
              <div>
                <div className="text-sm font-semibold text-white">{brand.name}</div>
                <div className="text-xs text-white/60">{brand.tagline}</div>
              </div>
            </div>
          </div>

          <SidebarNav items={navItems} />

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-medium text-white/60">Signed in as</div>
            <div className="mt-1 text-sm font-semibold text-white">{user?.email ?? '—'}</div>
            <Button
              className="mt-3 w-full justify-center"
              tone="ghost"
              onClick={onLogout}
              leftIcon={<LogOut size={16} />}
            >
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="flex w-full flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 md:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="text-sm font-semibold text-white">{currentTitle}</div>
                <div className="text-xs text-white/60">{user?.role ?? '—'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-white/60 sm:inline">{user?.email}</span>
              <Button tone="ghost" onClick={onLogout} leftIcon={<LogOut size={16} />}>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={() => setMobileOpen(false)}>
              <div
                className="absolute left-0 top-0 h-full w-80 border-r border-white/10 bg-slate-950 p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5">
                  <div className="text-sm font-semibold text-white">{brand.name}</div>
                  <div className="text-xs text-white/60">{brand.tagline}</div>
                </div>
                <SidebarNav items={navItems} />
              </div>
            </div>
          ) : null}

          <main className="w-full p-4 sm:p-6">
            <div className="mb-4 hidden sm:block">
              <div className="text-sm font-semibold text-white">{currentTitle}</div>
              <div className="text-xs text-white/60">Production-ready UI with real API integration</div>
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

