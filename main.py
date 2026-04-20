import solara
import os
import pandas as pd
import plotly.express as px
from dotenv import load_dotenv

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
def MetricTile(title, value, trend):
    with solara.Column(style={
        "background": "#111",
        "padding": "24px",
        "border-radius": "20px",
        "border": "1px solid #222",
        "flex": "1"
    }):
        solara.Text(title.upper(), style={"font-size": "10px", "color": "#666", "font-weight": "800", "letter-spacing": "2px"})
        solara.Text(value, style={"font-size": "36px", "font-weight": "900", "margin": "8px 0", "color": "white"})
        solara.Text(trend, style={"font-size": "12px", "color": "#4ade80", "font-weight": "bold"})

@solara.component
def Sidebar():
    with solara.Column(style={
        "width": "280px", 
        "background-color": "#080808", 
        "height": "100vh", 
        "padding": "40px 24px", 
        "border-right": "1px solid #111"
    }):
        solara.Text("VAULT", style={"font-size": "24px", "font-weight": "900", "color": "#6366f1", "font-style": "italic", "margin-bottom": "40px"})
        
        with solara.Column(gap="12px"):
            views = [("dashboard", "Dashboard"), ("accounts", "Accounts")]
            for view_id, label in views:
                is_active = active_view.value == view_id
                solara.Button(
                    label=label,
                    on_click=lambda v=view_id: active_view.set(v),
                    text=True,
                    style={
                        "color": "white" if is_active else "#555",
                        "justify-content": "start",
                        "width": "100%",
                        "font-weight": "700",
                        "background-color": "#111" if is_active else "transparent",
                        "border-radius": "10px"
                    }
                )

@solara.component
def DashboardView():
    df = pd.DataFrame(accounts_data.value)
    total = df['balance'].sum()
    
    with solara.Column(gap="32px", style={"width": "100%", "padding": "40px"}):
        # Header
        with solara.Column():
            solara.Text("VAULT OVERVIEW", style={"font-size": "12px", "color": "#818cf8", "font-weight": "900", "letter-spacing": "3px"})
            solara.Text("Net Worth Dashboard", style={"font-size": "42px", "font-weight": "900", "color": "white", "letter-spacing": "-1px"})

        # Stats Row
        with solara.Row(gap="20px"):
            MetricTile("Global Balance", f"${total:,.2f}", "↑ 4.2% Monthly")
            MetricTile("Assets Linked", str(len(df)), "Live Connection")
            MetricTile("Est. Yield", "$420.50", "Passive Income")

        # Visualization
        with solara.Row(gap="24px", style={"margin-top": "20px"}):
            with solara.Column(style={"flex": "1", "background": "#0a0a0a", "padding": "32px", "border-radius": "32px", "border": "1px solid #111"}):
                solara.Text("Asset Allocation", style={"font-size": "16px", "font-weight": "700", "color": "white", "margin-bottom": "24px"})
                fig = px.pie(df, values='balance', names='bank', hole=.75, color_discrete_sequence=['#6366f1', '#a855f7', '#ec4899'])
                fig.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)', 
                    plot_bgcolor='rgba(0,0,0,0)', 
                    font_color="white", 
                    margin=dict(t=0, b=0, l=0, r=0),
                    height=350,
                    showlegend=True,
                    legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5)
                )
                solara.FigurePlotly(fig)

@solara.component
def AccountsView():
    with solara.Column(gap="32px", style={"width": "100%", "padding": "40px"}):
        with solara.Row(justify="space-between", style={"align-items": "center"}):
            solara.Text("Managed Portfolio", style={"font-size": "32px", "font-weight": "900", "color": "white"})
            solara.Button("Connect via Plaid", color="primary", style={"background": "#6366f1", "padding": "12px 24px", "border-radius": "12px"})

        with solara.Row(gap="20px", style={"flex-wrap": "wrap"}):
            for acc in accounts_data.value:
                with solara.Column(style={"background": "#0a0a0a", "padding": "32px", "border-radius": "32px", "min-width": "350px", "border": "1px solid #111"}):
                    solara.Text(acc['bank'].upper(), style={"font-size": "10px", "color": "#818cf8", "font-weight": "900", "letter-spacing": "2px"})
                    solara.Text(acc['name'], style={"font-size": "24px", "font-weight": "700", "margin": "12px 0", "color": "white"})
                    solara.Text(f"${acc['balance']:,.2f}", style={"font-size": "36px", "font-weight": "900", "color": "white"})

@solara.component
def Page():
    # Global aggressive dark styles to override any default light theme
    solara.Style("""
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        html, body, #solara-main { background-color: #050505 !important; color: white !important; margin: 0; padding: 0; }
        * { font-family: 'Inter', sans-serif !important; }
        .v-application { background: #050505 !important; }
        .v-main { background: #050505 !important; }
        button { text-transform: none !important; letter-spacing: 0 !important; }
    """)

    with solara.Row(style={"min-height": "100vh"}):
        Sidebar()
        with solara.Column(style={"flex": "1", "background": "radial-gradient(circle at 50% 0%, #111 0%, #050505 100%)", "height": "100vh", "overflow-y": "auto"}):
            if active_view.value == "dashboard":
                DashboardView()
            else:
                AccountsView()

app = Page()
