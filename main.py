import solara
import solara.lab
import os
import pandas as pd
import plotly.express as px
from dotenv import load_dotenv

# Optional Plaid Imports
try:
    import plaid
    from plaid.api import plaid_api
    from plaid.model.link_token_create_request import LinkTokenCreateRequest
    from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
    from plaid.model.products import Products
    from plaid.model.country_code import CountryCode
except ImportError:
    plaid = None

load_dotenv()

# --- APP STATE ---
active_view = solara.reactive("dashboard")
accounts_data = solara.reactive([
    {"name": "BoA Checking", "type": "Checking", "balance": 12450.50, "bank": "Bank of America", "change": "+2.4%"},
    {"name": "SoFi Savings", "type": "Savings", "balance": 45201.00, "bank": "SoFi", "change": "+0.1%"},
    {"name": "Schwab Brokerage", "type": "Investment", "balance": 89300.25, "bank": "Charles Schwab", "change": "+5.8%"},
])

# --- COMPONENTS ---

@solara.component
def MetricTile(title, value, trend, color="#818cf8"):
    with solara.Column(style={
        "background": "rgba(255,255,255,0.05)",
        "padding": "24px",
        "border-radius": "20px",
        "border": f"1px solid rgba(255,255,255,0.08)",
        "flex": "1"
    }):
        solara.Text(title.upper(), style={"font-size": "10px", "color": "rgba(255,255,255,0.4)", "font-weight": "800", "letter-spacing": "2px"})
        solara.Text(value, style={"font-size": "36px", "font-weight": "900", "margin": "8px 0", "color": "white"})
        solara.Text(trend, style={"font-size": "12px", "color": "#4ade80", "font-weight": "bold"})

@solara.component
def Dashboard():
    df = pd.DataFrame(accounts_data.value)
    total = df['balance'].sum()
    
    with solara.Column(gap="32px", style={"width": "100%", "max-width": "1200px", "margin": "0 auto"}):
        # Header
        with solara.Row(justify="space-between", style={"align-items": "center"}):
            with solara.Column():
                solara.Text("VAULT OVERVIEW", style={"font-size": "12px", "color": "#818cf8", "font-weight": "900", "letter-spacing": "3px"})
                solara.Text("Net Worth Dashboard", style={"font-size": "32px", "font-weight": "900", "color": "white", "letter-spacing": "-1px"})
            solara.Button("Force Sync", color="primary", outlined=True)

        # Quick Stats
        with solara.Row(gap="20px"):
            MetricTile("Global Balance", f"${total:,.2f}", "↑ 4.2% Monthly")
            MetricTile("Assets Linked", str(len(df)), "Live Connection")
            MetricTile("Est. Yield", "$420.50", "SoFi Savings Optim")

        # Visuals & Feed
        with solara.Row(gap="24px"):
            # Chart
            with solara.Column(style={"flex": "2", "background": "rgba(255,255,255,0.02)", "padding": "24px", "border-radius": "24px", "border": "1px solid rgba(255,255,255,0.05)"}):
                solara.Text("Portfolio Distribution", style={"font-size": "14px", "font-weight": "700", "color": "white", "margin-bottom": "20px"})
                fig = px.pie(df, values='balance', names='bank', hole=.75, color_discrete_sequence=['#6366f1', '#a855f7', '#ec4899'])
                fig.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)', 
                    plot_bgcolor='rgba(0,0,0,0)', 
                    font_color="white", 
                    margin=dict(t=0, b=0, l=0, r=0),
                    height=300
                )
                try:
                    solara.FigurePlotly(fig)
                except:
                    solara.Text("Chart loading...", style={"color": "#444"})

            # Insights List
            with solara.Column(style={"flex": "1", "background": "rgba(255,255,255,0.02)", "padding": "24px", "border-radius": "24px", "border": "1px solid rgba(255,255,255,0.05)"}):
                solara.Text("Vault Intelligence", style={"font-size": "14px", "font-weight": "700", "color": "white", "margin-bottom": "20px"})
                for item in ["Optimize SoFi", "Schwab Rebalance", "High Yield Alert"]:
                    with solara.Row(style={"padding": "12px", "background": "rgba(255,255,255,0.03)", "border-radius": "12px", "margin-bottom": "12px"}):
                        solara.Text(item, style={"font-size": "12px", "color": "rgba(255,255,255,0.6)", "font-weight": "600"})

@solara.component
def Accounts():
    with solara.Column(gap="32px", style={"width": "100%", "max-width": "1200px", "margin": "0 auto"}):
        with solara.Row(justify="space-between", style={"align-items": "center"}):
            solara.Text("Managed Portfolio", style={"font-size": "32px", "font-weight": "900", "color": "white"})
            solara.Button("Connect via Plaid", color="primary", style={"background": "#6366f1", "padding": "12px 24px", "border-radius": "12px"})

        with solara.Row(gap="20px", style={"flex-wrap": "wrap"}):
            for acc in accounts_data.value:
                with solara.Column(style={"background": "rgba(255,255,255,0.03)", "padding": "24px", "border-radius": "24px", "min-width": "320px", "border": "1px solid rgba(255,255,255,0.05)"}):
                    solara.Text(acc['bank'].upper(), style={"font-size": "10px", "color": "#818cf8", "font-weight": "900", "letter-spacing": "2px"})
                    solara.Text(acc['name'], style={"font-size": "20px", "font-weight": "700", "margin": "10px 0", "color": "white"})
                    solara.Text(f"${acc['balance']:,.2f}", style={"font-size": "28px", "font-weight": "900", "color": "white"})

@solara.component
def Page():
    # Force the app into Dark Mode
    solara.lab.Theme(
        dark=True,
        toggle_button=False,
    )
    
    solara.Style("""
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        
        #solara-main { background-color: #020202 !important; min-height: 100vh; }
        .v-application { background: #020202 !important; font-family: 'Inter', sans-serif !important; }
        .v-navigation-drawer { background-color: #080808 !important; border-right: 1px solid #111 !important; }
        .v-btn { text-transform: none !important; letter-spacing: 0 !important; font-weight: 700 !important; }
    """)

    with solara.lab.NavLayout():
        with solara.lab.Sidebar():
            with solara.Column(padding="32px"):
                solara.Text("VAULT", style={"font-size": "24px", "font-weight": "900", "color": "#6366f1", "font-style": "italic"})
                with solara.Column(gap="10px", style={"margin-top": "40px"}):
                    solara.Button("Dashboard", on_click=lambda: active_view.set("dashboard"), text=True, style={"justify-content": "start", "color": "white" if active_view.value == "dashboard" else "#666"})
                    solara.Button("Accounts", on_click=lambda: active_view.set("accounts"), text=True, style={"justify-content": "start", "color": "white" if active_view.value == "accounts" else "#666"})

        with solara.Column(style={"padding": "32px", "min-height": "100vh", "background": "radial-gradient(circle at 50% 0%, #111 0%, #020202 100%)"}):
            if active_view.value == "dashboard":
                Dashboard()
            else:
                Accounts()

app = Page()
