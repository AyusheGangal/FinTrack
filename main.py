import solara
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
import os
import pandas as pd
import plotly.express as px
from dotenv import load_dotenv
import solara.lab

load_dotenv()

# Plaid Setup
PLAID_CLIENT_ID = os.environ.get('PLAID_CLIENT_ID')
PLAID_SECRET = os.environ.get('PLAID_SECRET')
PLAID_ENV = os.environ.get('PLAID_ENV', 'sandbox')

# Configuration
plaid_host = plaid.Environment.Sandbox
if PLAID_ENV == 'development':
    plaid_host = plaid.Environment.Development
elif PLAID_ENV == 'production':
    plaid_host = plaid.Environment.Production

configuration = plaid.Configuration(
    host=plaid_host,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
    }
)
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

# App State
active_view = solara.reactive("dashboard")
access_tokens = solara.reactive([])
accounts_data = solara.reactive([
    {"name": "BoA Checking", "type": "Checking", "balance": 12450.50, "bank": "Bank of America"},
    {"name": "SoFi Savings", "type": "Savings", "balance": 45200.00, "bank": "SoFi"},
    {"name": "Schwab Brokerage", "type": "Investment", "balance": 89300.25, "bank": "Charles Schwab"},
])

@solara.component
def Sidebar():
    with solara.Column(classes=["sidebar"], style={"width": "250px", "background-color": "#111", "height": "100vh", "padding": "20px", "color": "white"}):
        solara.Text("VAULT", style={"font-family": "Inter", "font-style": "italic", "color": "#6366f1", "font-size": "24px", "font-weight": "800"})
        
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
            solara.Text(f"${total_net_worth:,.2f}", style={"font-size": "48px", "margin": "0", "font-style": "italic", "font-weight": "800"})
        
        with solara.Row(gap="20px"):
            fig = px.pie(df, values='balance', names='bank', title='Allocation by Bank', hole=.4)
            fig.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color="white", title_font_color="white")
            solara.FigurePlotly(fig)

@solara.component
def PlaidLink(on_success_callback):
    link_token, set_link_token = solara.use_state(None)
    
    def fetch_token():
        if not PLAID_CLIENT_ID or not PLAID_SECRET:
            print("Plaid Keys missing!")
            return
        try:
            request = LinkTokenCreateRequest(
                products=[Products("transactions")],
                user=LinkTokenCreateRequestUser(client_user_id="user-id"),
                client_name="Vault",
                language="en",
                country_codes=[CountryCode("US")],
            )
            response = client.link_token_create(request)
            set_link_token(response['link_token'])
        except Exception as e:
            print(f"Error creating link token: {e}")

    solara.use_effect(fetch_token, [])

    script = f"""
    (function() {{
        if (!window.Plaid) {{
            var script = document.createElement('script');
            script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
            script.onload = launch;
            document.head.appendChild(script);
        }} else {{
            launch();
        }}
        function launch() {{
            const handler = Plaid.create({{
                token: '{link_token}',
                onSuccess: (public_token, metadata) => {{
                    console.log('Success!', public_token);
                }},
            }});
            handler.open();
        }}
    }})();
    """ if link_token else ""

    return solara.HTML(tag="span", unsafe_html=f"<script>{script}</script>")

@solara.component
def AccountsView():
    show_link, set_show_link = solara.use_state(False)
    
    with solara.Column(gap="20px", style={"padding": "40px", "width": "100%"}):
        with solara.Row(justify="space-between", style={"align-items": "center"}):
            solara.Text("Connected Portfolio", style={"font-size": "24px", "font-weight": "bold"})
            solara.Button("Connect via Plaid", on_click=lambda: set_show_link(True), color="primary", style={"background-color": "#6366f1"})
        
        if show_link:
            PlaidLink(lambda: set_show_link(False))

        if not access_tokens.value:
            with solara.Column(style={"background": "rgba(255,255,255,0.02)", "padding": "40px", "border-radius": "18px", "border": "1px dashed rgba(255,255,255,0.1)", "text-align": "center"}):
                solara.Text("NO LIVE SYNC ACTIVE", style={"font-size": "12px", "color": "#666", "letter-spacing": "2px"})
                solara.Text("Connect Plaid to see real-time balances from BoA, Schwab, and SoFi.", style={"color": "#444", "margin-top": "10px"})

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
    """)
    
    with solara.Row(style={"min-height": "100vh"}):
        Sidebar()
        with solara.Column(style={"flex": "1"}):
            if active_view.value == "dashboard":
                DashboardView()
            elif active_view.value == "accounts":
                AccountsView()
            else:
                solara.Text("Insights coming soon...")

app = Page()
