import solara
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
import os
import pandas as pd
import plotly.express as px
from dotenv import load_dotenv

load_dotenv()

# Plaid Setup
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,
    api_key={
        'clientId': os.environ.get('PLAID_CLIENT_ID'),
        'secret': os.environ.get('PLAID_SECRET'),
    }
)
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

# App State
active_view = solara.reactive("dashboard")
accounts_data = solara.reactive([
    {"name": "BoA Checking", "type": "Checking", "balance": 12450.50, "bank": "Bank of America"},
    {"name": "SoFi Savings", "type": "Savings", "balance": 45200.00, "bank": "SoFi"},
    {"name": "Schwab Brokerage", "type": "Investment", "balance": 89300.25, "bank": "Charles Schwab"},
])

@solara.component
def Sidebar():
    with solara.Column(classes=["sidebar"], style={"width": "250px", "background-color": "#111", "height": "100vh", "padding": "20px", "color": "white"}):
        solara.HTML(tag="h2", style={"font-family": "Inter", "font-style": "italic", "color": "#6366f1"}, children=["VAULT"])
        
        with solara.Column(gap="10px", style={"margin-top": "40px"}):
            solara.Button("Dashboard", on_click=lambda: active_view.set("dashboard"), text=True, style={"color": "white" if active_view.value == "dashboard" else "#888"})
            solara.Button("Accounts", on_click=lambda: active_view.set("accounts"), text=True, style={"color": "white" if active_view.value == "accounts" else "#888"})
            solara.Button("Insights", on_click=lambda: active_view.set("insights"), text=True, style={"color": "white" if active_view.value == "insights" else "#888"})

@solara.component
def DashboardView():
    df = pd.DataFrame(accounts_data.value)
    total_net_worth = df['balance'].sum()
    
    with solara.Column(gap="20px", style={"padding": "40px", "width": "100%"}):
        with solara.Column():
            solara.Text("GLOBAL DASHBOARD", style={"font-size": "10px", "letter-spacing": "2px", "color": "#666"})
            solara.HTML(tag="h1", style={"font-size": "48px", "margin": "0", "font-style": "italic"}, children=[f"${total_net_worth:,.2f}"])
        
        with solara.Row(gap="20px"):
            # Mock Chart
            fig = px.pie(df, values='balance', names='bank', title='Allocation by Bank', hole=.4)
            fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="white", title_font_color="white")
            solara.FigurePlotly(fig)

@solara.component
def AccountsView():
    # Placeholder for Plaid Link Launch Logic
    # In a local environment, you would use solara.use_effect to load the Plaid JS
    def launch_plaid():
        print("Launching Plaid Link flow...")
        # Here we would fetch a link_token from the backend and call window.Plaid.create(...)

    with solara.Column(gap="20px", style={"padding": "40px", "width": "100%"}):
        with solara.Row(justify="space-between", style={"align-items": "center"}):
            solara.HTML(tag="h2", children=["Connected Portfolio"])
            solara.Button("Add New Account (Plaid)", on_click=launch_plaid, color="primary", style={"background-color": "#6366f1"})

        with solara.Row(gap="20px", style={"flex-wrap": "wrap"}):
            for acc in accounts_data.value:
                with solara.Column(style={"background": "rgba(255,255,255,0.03)", "padding": "25px", "border-radius": "18px", "min-width": "280px", "border": "1px solid rgba(255,255,255,0.05)", "backdrop-filter": "blur(10px)"}):
                    solara.Text(acc['bank'].upper(), style={"font-size": "9px", "color": "#818cf8", "font-weight": "800", "letter-spacing": "1.5px"})
                    solara.Text(acc['name'], style={"font-size": "20px", "margin": "12px 0", "font-weight": "500"})
                    solara.Text(f"${acc['balance']:,.2f}", style={"font-size": "28px", "font-weight": "700", "color": "white"})
                    
                    with solara.Row(justify="space-between", style={"margin-top": "20px", "border-top": "1px solid rgba(255,255,255,0.05)", "padding-top": "15px"}):
                        solara.Text("SYNCED", style={"font-size": "9px", "color": "#4ade80", "font-weight": "bold"})
                        solara.Text("ASSET CLASS • USD", style={"font-size": "9px", "color": "#444"})

@solara.component
def Page():
    # Global Styles for that 'Vault' look
    solara.Style("""
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body { 
            background-color: #050505; 
            color: white; 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            background-image: radial-gradient(circle at 50% -20%, #1e1b4b 0%, #050505 50%);
            background-attachment: fixed;
        }
        .sidebar { border-right: 1px solid rgba(255,255,255,0.05); }
        button { border-radius: 12px !important; text-transform: uppercase !important; letter-spacing: 1px !important; font-size: 11px !important; font-weight: 700 !important; }
        .v-btn--text { padding: 12px 20px !important; justify-content: start !important; }
    """)
    
    with solara.Row(style={"min-height": "100vh"}):
        Sidebar()
        with solara.Column(style={"flex": "1"}):
            if active_view.value == "dashboard":
                DashboardView()
            elif active_view.value == "accounts":
                AccountsView()
            else:
                solara.Text("Coming Soon...")

# Entry point for solara run
app = Page()
