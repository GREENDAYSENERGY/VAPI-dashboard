/* App shell — routes between screens, owns global theme/density state */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "comfortable",
  "sidebar": "full",
  "accent": "#0079c1",
  "showTicker": true
}/*EDITMODE-END*/;

function App() {
  const [screen, setScreen] = React.useState("overview");
  const [openCall, setOpenCall] = React.useState(null);
  const [tweaks, setTweaks] = window.useTweaks(TWEAK_DEFAULTS);

  // Apply theme/density/sidebar to <html> so CSS hooks pick them up
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", tweaks.theme);
    root.setAttribute("data-density", tweaks.density);
    root.setAttribute("data-sidebar", tweaks.sidebar);

    // Update accent — derive related variables from the chosen color
    const accent = tweaks.accent;
    root.style.setProperty("--accent", accent);

    // Mix darker shades for hover/strong by blending toward black via color-mix
    root.style.setProperty("--accent-strong",
      `color-mix(in oklch, ${accent} 78%, black)`);
    root.style.setProperty("--accent-deep",
      `color-mix(in oklch, ${accent} 56%, black)`);
    root.style.setProperty("--accent-soft",
      `color-mix(in oklch, ${accent} 14%, var(--surface))`);
    root.style.setProperty("--accent-soft-2",
      `color-mix(in oklch, ${accent} 28%, var(--surface))`);
  }, [tweaks.theme, tweaks.density, tweaks.sidebar, tweaks.accent]);

  const liveCount = window.VAPI_DATA.LIVE_CALLS.filter(c => c.status === "in-progress").length;

  return (
    <div className="app">
      <Sidebar
        current={screen}
        onNavigate={setScreen}
        liveCount={liveCount}
      />
      <div className="main">
        <Topbar
          screen={screen}
          liveCount={liveCount}
          showTicker={tweaks.showTicker}
          onGoLive={() => setScreen("live")}
        />
        <div className="page">
          {screen === "overview" && (
            <OverviewScreen
              onOpenCall={setOpenCall}
              onGoLive={() => setScreen("live")}
              onGoLogs={() => setScreen("logs")}
              liveCount={liveCount}
            />
          )}
          {screen === "live" && <LiveCallsScreen onOpenCall={setOpenCall}/>}
          {screen === "logs" && <CallLogsScreen onOpenCall={setOpenCall}/>}
          {screen === "analytics" && <AnalyticsScreen/>}
          {screen === "billing" && (
            <div className="empty" style={{padding: 120}}>
              <Icons.Wallet size={32} stroke="var(--text-4)"/>
              <div style={{marginTop: 12, fontSize: 13}}>Billing screen — coming next sprint.</div>
            </div>
          )}
          {(screen === "assistant" || screen === "numbers" || screen === "team") && (
            <div className="empty" style={{padding: 120}}>
              <Icons.Settings size={32} stroke="var(--text-4)"/>
              <div style={{marginTop: 12, fontSize: 13}}>Configuration · {screen}</div>
              <div style={{marginTop: 4, fontSize: 11}}>Out of scope for this prototype — focus is on operations screens.</div>
            </div>
          )}
        </div>
      </div>

      {openCall && (
        <CallDetailDrawer call={openCall} onClose={() => setOpenCall(null)}/>
      )}

      <AppTweaks tweaks={tweaks} setTweaks={setTweaks}/>
    </div>
  );
}

function AppTweaks({ tweaks, setTweaks }) {
  const { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor } = window;
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Appearance">
        <TweakRadio
          label="Theme"
          value={tweaks.theme}
          options={[{label:"Light", value:"light"}, {label:"Dark", value:"dark"}]}
          onChange={(v) => setTweaks({ theme: v })}
        />
        <TweakColor
          label="Accent"
          value={tweaks.accent}
          options={["#0079c1", "#0a4a73", "#1f8a5b", "#7c3aed", "#d97706"]}
          onChange={(v) => setTweaks({ accent: v })}
        />
        <TweakRadio
          label="Density"
          value={tweaks.density}
          options={[{label:"Comfy", value:"comfortable"}, {label:"Compact", value:"compact"}]}
          onChange={(v) => setTweaks({ density: v })}
        />
      </TweakSection>

      <TweakSection label="Layout">
        <TweakRadio
          label="Sidebar"
          value={tweaks.sidebar}
          options={[
            {label:"Full",  value:"full"},
            {label:"Rail",  value:"rail"},
            {label:"Icons", value:"icons"}
          ]}
          onChange={(v) => setTweaks({ sidebar: v })}
        />
        <TweakToggle
          label="Live ticker"
          value={tweaks.showTicker}
          onChange={(v) => setTweaks({ showTicker: v })}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
