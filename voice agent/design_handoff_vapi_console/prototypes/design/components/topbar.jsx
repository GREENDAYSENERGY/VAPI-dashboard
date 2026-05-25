/* Topbar — breadcrumbs, search, live ticker, profile */

function Topbar({ screen, liveCount, onGoLive, showTicker = true }) {
  const labels = {
    overview:  ["Operations", "Overview"],
    live:      ["Operations", "Live Calls"],
    logs:      ["Operations", "Call Logs"],
    analytics: ["Operations", "Analytics"],
    billing:   ["Operations", "Billing"],
    assistant: ["Configure",  "Assistant"],
    numbers:   ["Configure",  "Phone Numbers"],
    team:      ["Configure",  "Team"],
  }[screen] || ["Operations", "Overview"];

  return (
    <header className="topbar">
      <div className="crumbs">
        <span>{labels[0]}</span>
        <Icons.ChevronRight size={12}/>
        <span className="cur">{labels[1]}</span>
      </div>

      <div className="grow"></div>

      <div className="search">
        <Icons.Search size={14}/>
        <input placeholder="Search calls, customers, transcripts…"/>
        <kbd>⌘K</kbd>
      </div>

      {showTicker && (
        <div className="live-ticker" onClick={onGoLive} title="Jump to live monitoring">
          <span className="ldot"></span>
          <span><b>{liveCount}</b> live</span>
          <span className="sep"></span>
          <span><b>17</b> queued</span>
          <span className="sep"></span>
          <span>Today <b>$74</b></span>
        </div>
      )}

      <div className="topbar-divider"></div>

      <button type="button" className="icon-btn" title="Notifications">
        <Icons.Bell size={16}/>
        <span className="pip"></span>
      </button>

      <button type="button" className="profile">
        <div className="av">AM</div>
        <div>
          <div className="pn">Alex Morgan</div>
          <div className="pr">Ops Lead</div>
        </div>
        <Icons.ChevronDown size={14}/>
      </button>
    </header>
  );
}

Object.assign(window, { Topbar });
