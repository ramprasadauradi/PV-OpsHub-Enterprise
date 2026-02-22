key={stage} className={`flex items-center gap-4 p-3 rounded-lg border ${i < 2 ? "bg-green-50 border-green-200" : i === 2 ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 2 ? "bg-green-500 text-white" : i === 2 ? "bg-blue-500 text-white" : "bg-slate-300 text-slate-600"}`}>
                        {i < 2 ? "✓" : i === 2 ? "→" : i + 1}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-slate-800">{stage}</span>
                        <span className="text-xs text-slate-500 ml-2">{i < 2 ? "Completed" : i === 2 ? "In Progress" : "Pending"}</span>
                      </div>
                      {i < 2 && <span className="ml-auto text-xs text-slate-400">{new Date(Date.now() - (3 - i) * 86400000).toLocaleDateString()}</span>}
                    </div>
                  ))}
            </div>
          )}
          {activeTab === "corrections" && (
            <div className="space-y-2">
              {[{cat:"DATA_ENTRY", desc:"Incorrect date format in MR narrative", stage:"DE", resolved:true}, {cat:"CODING", desc:"MedDRA term misaligned with reporter term", stage:"QC", resolved:false}].map((corr, i) => (
                <div key={i} className={`p-3 rounded-lg border ${corr.resolved ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge label={corr.cat} colorClass="bg-orange-100 text-orange-700" />
                    <span className={`text-xs font-medium ${corr.resolved ? "text-green-700" : "text-amber-700"}`}>{corr.resolved ? "✅ Resolved" : "⚠️ Open"}</span>
                  </div>
                  <p className="text-sm text-slate-700">{corr.desc}</p>
                  <p className="text-xs text-slate-500 mt-1">Stage: {corr.stage}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === "allocation" && (
            <div className="space-y-2">
              {[{num:1, user:"Vikram Singh", by:"Arjun Nair (TL)", at:"3 days ago"}, {num:2, user:"Anita Desai", by:"Priya Sharma (PM)", at:"1 day ago"}].map((alloc, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Allocation #{alloc.num}</span>
                    <span className="text-xs text-slate-400">{alloc.at}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-1">→ {alloc.user}</p>
                  <p className="text-xs text-slate-500">Allocated by {alloc.by}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === "audit" && (
            <div className="space-y-2">
              {[
                {action:"CASE_CREATED", user:"Admin", time:"5 days ago"},
                {action:"CASE_ALLOCATED", user:"Arjun Nair", time:"3 days ago"},
                {action:"CASE_REALLOCATED", user:"Priya Sharma", time:"1 day ago"},
                {action:"CORRECTION_LOGGED", user:"Vikram Singh", time:"6 hours ago"},
              ].map((entry, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                  <div className="w-2 h-2 bg-blue-400 rounded-full shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-700 font-mono">{entry.action}</span>
                    <span className="text-xs text-slate-500 ml-2">by {entry.user}</span>
                  </div>
                  <span className="text-xs text-slate-400">{entry.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direct Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium mr-2">Actions:</span>
          {["Reassign", "Escalate", "Add Note", "Hold", "Log Correction"].map(action => (
            <button key={action} className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-colors font-medium">
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════

const PAGES = {
  cases: "Case Management",
  allocation: "Allocation Engine",
  tl_dashboard: "Team Lead Dashboard",
  project: "Project Leaderboard",
  sla: "SLA Heatmap & Forecast",
}

const NAV_ITEMS = [
  { key: "cases", label: "Case Management", icon: "📄", group: "Operations" },
  { key: "allocation", label: "Allocation", icon: "🎯", group: "Operations" },
  { key: "tl_dashboard", label: "TL Dashboard", icon: "📊", group: "Dashboards" },
  { key: "project", label: "Project Dashboard", icon: "🏆", group: "Dashboards" },
  { key: "sla", label: "SLA Monitor", icon: "⚡", group: "SLA & Risk" },
]

const TL_TABS = ["Allocation", "HA/VAP", "Aging", "Quality", "Productivity", "Hold Status"]

export default function PVOpsHub() {
  const [page, setPage] = useState("tl_dashboard")
  const [activeTab, setActiveTab] = useState(0)
  const [selectedCase, setSelectedCase] = useState(null)
  const [hasHold, setHasHold] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [pulseAlert, setPulseAlert] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setPulseAlert(false), 3000)
    return () => clearTimeout(t)
  }, [])

  const filteredCases = MOCK_CASES.filter(c =>
    !searchQuery ||
    c.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.productName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groups = [...new Set(NAV_ITEMS.map(i => i.group))]

  return (
    <div className="flex h-screen bg-slate-100 font-sans" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-56"} bg-slate-900 flex flex-col transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-800 gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">PV</span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="font-bold text-white text-sm leading-none">PV-OpsHub</div>
              <div className="text-slate-500 text-[10px] mt-0.5">v3.0 MVP</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto px-2 space-y-5">
          {groups.map(group => (
            <div key={group}>
              {!sidebarCollapsed && (
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-2 mb-1">{group}</div>
              )}
              {NAV_ITEMS.filter(i => i.group === group).map(item => (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${page === item.key ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span className="text-xs font-medium">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 border-t border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center"
        >
          <span className="text-xs">{sidebarCollapsed ? "→" : "←"}</span>
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 shrink-0">
          <div className="flex-1">
            {/* Search */}
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cases..."
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className={`w-2 h-2 rounded-full bg-green-500 ${pulseAlert ? "animate-pulse" : ""}`} />
              Live
            </div>

            {/* Hold badge */}
            {hasHold && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1 text-xs text-red-700 font-medium">
                🔒 Hold Active
              </div>
            )}

            {/* SLA Alert */}
            <button className="relative p-1.5 rounded-lg hover:bg-slate-100">
              <span className="text-lg">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">PS</div>
              <div className="text-xs hidden sm:block">
                <div className="font-medium text-slate-800">Priya Sharma</div>
                <div className="text-slate-400">Project Manager</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-[1400px] mx-auto">
            {/* Page title */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold text-slate-900">{PAGES[page]}</h1>
                <p className="text-xs text-slate-500 mt-0.5">Acme CRO Pvt Ltd · Asia/Kolkata · Last updated just now</p>
              </div>
              {page === "cases" && (
                <button className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <span>+</span> New Case
                </button>
              )}
            </div>

            {/* CASE MANAGEMENT */}
            {page === "cases" && (
              <div className="space-y-4">
                {/* Filters row */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 flex-wrap">
                  {[["Status", ["All", "UNALLOCATED", "ALLOCATED", "IN_PROGRESS", "ON_HOLD"]], ["Stage", ["All", "INTAKE", "DE", "QC", "MR", "SUBMISSION"]], ["Complexity", ["All", "LOW", "MEDIUM", "HIGH", "CRITICAL"]], ["HA/VAP", ["All", "HA", "VAP", "NEITHER"]]].map(([label, opts]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">{label}:</span>
                      <select className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-slate-500">{filteredCases.length} cases</span>
                    <button className="text-xs border border-slate-200 px-3 py-1 rounded-md hover:bg-slate-50 text-slate-600 font-medium">📥 Export</button>
                  </div>
                </div>
                <CaseTable
                  cases={filteredCases}
                  onSelect={setSelectedCase}
                  selectedIds={selectedIds}
                  onToggleSelect={(id) => setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])}
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Showing 1–15 of {filteredCases.length}</span>
                  <div className="flex gap-1">
                    {[1,2,3].map(p => <button key={p} className={`w-7 h-7 rounded ${p === 1 ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}>{p}</button>)}
                  </div>
                </div>
              </div>
            )}

            {/* ALLOCATION */}
            {page === "allocation" && <AllocationPanel />}

            {/* TL DASHBOARD */}
            {page === "tl_dashboard" && (
              <div>
                <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                  {TL_TABS.map((tab, i) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(i)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === i ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {["📋", "🏥", "⏰", "✅", "📈", "🔒"][i]} {tab}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
                      <option>Auto 15s</option>
                      <option>Auto 30s</option>
                      <option>Manual</option>
                    </select>
                    <button className="text-xs border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium">↻ Refresh</button>
                  </div>
                </div>

                {activeTab === 0 && <AllocationTab />}
                {activeTab === 1 && <HaVapTab />}
                {activeTab === 2 && <AgingTab />}
                {activeTab === 3 && <QualityTab />}
                {activeTab === 4 && <ProductivityTab />}
                {activeTab === 5 && <HoldStatusTab hasHold={hasHold} onRelease={() => setHasHold(false)} />}
              </div>
            )}

            {/* PROJECT LEADERBOARD */}
            {page === "project" && <ProjectDashboard />}

            {/* SLA HEATMAP */}
            {page === "sla" && <SLAHeatmapView />}
          </div>
        </main>
      </div>

      {/* Case Detail Modal */}
      {selectedCase && <CaseModal case={selectedCase} onClose={() => setSelectedCase(null)} />}
    </div>
  )
}
