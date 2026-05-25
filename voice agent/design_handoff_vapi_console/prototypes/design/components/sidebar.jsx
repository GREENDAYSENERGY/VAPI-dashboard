/* Sidebar — navigation + org switcher + footer */

function Sidebar({ current, onNavigate, liveCount }) {
  const items = [
    { id: "overview",  label: "Overview",   I: Icons.LayoutDashboard },
    { id: "live",      label: "Live Calls", I: Icons.Radio, live: true },
    { id: "logs",      label: "Call Logs",  I: Icons.List, count: 184 },
    { id: "analytics", label: "Analytics",  I: Icons.Activity },
    { id: "billing",   label: "Billing",    I: Icons.Wallet },
  ];
  const config = [
    { id: "assistant", label: "Assistant",     I: Icons.Bot },
    { id: "numbers",   label: "Phone Numbers", I: Icons.Phone },
    { id: "team",      label: "Team",          I: Icons.Users },
  ];

  const Link = ({ item }) => (
    <button
      type="button"
      className={
        "nav-link" +
        (current === item.id ? " active" : "") +
        (item.live ? " live-dot" : "")
      }
      onClick={() => onNavigate && onNavigate(item.id)}
    >
      <item.I size={16}/>
      <span>{item.label}</span>
      {item.count != null && <span className="count">{item.count}</span>}
      {item.live && liveCount > 0 && <span className="count" style={{marginLeft: "auto"}}>{liveCount}</span>}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="dots" src="design/assets/icon-dots-blue.svg" alt=""/>
        <div className="wordmark">Gadi<span className="ai">.ai</span></div>
      </div>

      <div className="sidebar-org" title="Switch organization">
        <div className="avatar">GG</div>
        <div className="meta">
          <div className="name">Go Green Builders</div>
          <div className="plan">Gadi Pro · 1,284 systems</div>
        </div>
        <Icons.ChevronDown className="chev" size={14}/>
      </div>

      <div className="sidebar-section">Operations</div>
      <nav className="sidebar-nav">
        {items.map(it => <Link key={it.id} item={it}/>)}
      </nav>

      <div className="sidebar-section">Configure</div>
      <nav className="sidebar-nav">
        {config.map(it => <Link key={it.id} item={it}/>)}
      </nav>

      <div className="sidebar-foot">
        <nav className="sidebar-nav">
          <button type="button" className="nav-link">
            <Icons.Settings size={16}/>
            <span>Settings</span>
          </button>
          <button type="button" className="nav-link">
            <Icons.HelpCircle size={16}/>
            <span>Help</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
