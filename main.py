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
import solara.lab

load_dotenv()

# --- CONFIG & STATE ---
PLAID_CLIENT_ID = os.environ.get('PLAID_CLIENT_ID')
PLAID_SECRET = os.environ.get('PLAID_SECRET')
PLAID_ENV = os.environ.get('PLAID_ENV', 'sandbox')

# Plaid Configuration
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
    {"name": "BoA Checking", "type": "Checking", "balance": 12450.50, "bank": "Bank of America", "change": "+2.4%"},
    {"name": "SoFi Savings", "type": "Savings", "balance": 45200.00, "bank": "SoFi", "change": "+0.1%"},
    {"name": "Schwab Brokerage", "type": "Investment", "balance": 89300.25, "bank": "Charles Schwab", "change": "+5.8%"},
])

# --- COMPONENTS ---

@solara.component
def PlaidLink(on_success_callback):
    link_token, set_link_token = solara.use_state(None)
    
    def fetch_token():
        if not PLAID_CLIENT_ID or not PLAID_SECRET:
            print("Plaid Keys missing!")
            return
        try:
            from plaid.model.link_token_create_request import LinkTokenCreateRequest
            from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
            from plaid.model.products import Products
            from plaid.model.country_code import CountryCode

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

    return solara.Div(
        children=[
            solara.HTML(tag="script", unsafe_html=f"""
                (function() {{
                    const token = '{link_token}';
                    if (!token) return;
                    const loadPlaid = () => {{
                        const handler = Plaid.create({{
                            token: token,
                            onSuccess: (pt, md) => {{ 
                                console.log('Plaid Success', pt); 
                                // In a local app, you'd send pt back to your Python backend here
                            }},
                        }});
                        handler.open();
                    }};
                    if (!window.Plaid) {{
                        const s = document.createElement('script');
                        s.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
                        s.onload = loadPlaid;
                        document.head.appendChild(s);
                    }} else {{ loadPlaid(); }}
                }})();
            """)
        ] if link_token else []
    )

@solara.component
def Sidebar():
    with solara.Column(classes=["sidebar"], style={
        "width": "280px", 
        "background-color": "#0a0a0a", 
        "height": "100vh", 
        "padding": "40px 24px", 
        "color": "white",
        "border-right": "1px solid rgba(255,255,255,0.05)"
    }):
        with solara.Row(style={"align-items": "center", "gap": "12px", "margin-bottom": "60px"}):
            solara.HTML(tag="div", style={"width": "32px", "height": "32px", "background": "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", "border-radius": "8px"})
            solara.Text("VAULT", style={"font-size": "20px", "font-weight": "800", "letter-spacing": "-1px"})
        
        with solara.Column(gap="8px"):
            nav_items = [
                ("dashboard", "Dashboard"),
                ("accounts", "Accounts"),
                ("insights", "Insights"),
                ("settings", "Settings")
            ]
            for view_id, label in nav_items:
                is_active = active_view.value == view_id
                bg_color = "rgba(255,255,255,0.05)" if is_active else "transparent"
                text_color = "white" if is_active else "rgba(255,255,255,0.4)"
                
                solara.Button(
                    label=label,
                    on_click=lambda v=view_id: active_view.set(v),
                    text=True,
                    style={
                        "background-color": bg_color,
                        "color": text_color,
                        "justify-content": "start",
                        "width": "100%",
                        "padding": "12px 16px",
                        "border-radius": "12px",
                        "font-weight": "600",
                        "font-size": "14px",
                        "text-transform": "none",
                        "letter-spacing": "normal"
                    }
                )

@solara.component
def MetricCard(title, value, subtitle=None, trend=None):
    with solara.Column(style={
        "background": "rgba(255,255,255,0.03)", 
        "padding": "24px", 
        "border-radius": "24px", 
        "border": "1px solid rgba(255,255,255,0.05)",
        "flex": "1",
        "min-width": "300px"
    }):
        solara.Text(title.upper(), style={"font-size": "10px", "color": "rgba(255,255,255,0.4)", "font-weight": "700", "letter-spacing": "1.5px"})
        solara.Text(value, style={"font-size": "32px", "font-weight": "800", "margin": "8px 0"})
        with solara.Row(justify="space-between"):
            if subtitle:
                solara.Text(subtitle, style={"font-size": "12px", "color": "rgba(255,255,255,0.3)"})
            if trend:
                solara.Text(trend, style={"font-size": "12px", "color": "#4ade80" if "+" in trend else "#f87171", "font-weight": "700"})

@solara.component
def DashboardView():
    df = pd.DataFrame(accounts_data.value)
    total_net_worth = df['balance'].sum()
    
    with solara.Column(gap="32px", style={"padding": "48px", "width": "100%", "max-width": "1200px"}):
        with solara.Column(gap="4px"):
            solara.Text("Welcome back,", style={"font-size": "14px", "color": "rgba(255,255,255,0.5)"})
            solara.Text("Strategic Overview", style={"font-size": "32px", "font-weight": "800", "letter-spacing": "-1px"})

        with solara.Row(gap="24px", style={"width": "100%"}):
            MetricCard("Net Worth", f"${total_net_worth:,.2f}", "Integrated Balances", "+4.2%")
            MetricCard("Liquid Assets", f"${(total_net_worth * 0.4):,.2f}", "Cash & Equivalents", "+1.1%")
            MetricCard("Investments", f"${(total_net_worth * 0.6):,.2f}", "Market Value", "+6.8%")
        
        with solara.Row(gap="32px", style={"width": "100%"}):
            # Allocation Chart
            with solara.Column(style={"flex": "2", "background": "rgba(255,255,255,0.02)", "padding": "32px", "border-radius": "32px", "border": "1px solid rgba(255,255,255,0.05)"}):
                solara.Text("Asset Allocation", style={"font-size": "16px", "font-weight": "700", "margin-bottom": "24px"})
                fig = px.pie(df, values='balance', names='bank', hole=.7, color_discrete_sequence=['#6366f1', '#a855f7', '#ec4899'])
                fig.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)', 
                    plot_bgcolor='rgba(0,0,0,0)', 
                    font_color="white", 
                    margin=dict(t=0, b=0, l=0, r=0),
                    showlegend=True,
                    legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5)
                )
                solara.FigurePlotly(fig)
            
            # Recent Activity / Insights
            with solara.Column(style={"flex": "1", "background": "rgba(255,255,255,0.02)", "padding": "32px", "border-radius": "32px", "border": "1px solid rgba(255,255,255,0.05)"}):
                solara.Text("Vault Insights", style={"font-size": "16px", "font-weight": "700", "margin-bottom": "24px"})
                insights = [
                    ("Yield Optimization", "Move $5k to SoFi for 4.6% APY"),
                    ("Diversification", "Schwab allocation is > 60%"),
                    ("Tax Efficiency", "Harvest losses in Brokerage")
                ]
                for title, desc in insights:
                    with solara.Column(style={"margin-bottom": "20px", "padding": "16px", "background": "rgba(255,255,255,0.03)", "border-radius": "16px"}):
                        solara.Text(title, style={"font-size": "13px", "font-weight": "700", "color": "#818cf8"})
                        solara.Text(desc, style={"font-size": "12px", "color": "rgba(255,255,255,0.5)", "margin-top": "4px"})

@solara.component
def AccountsView():
    show_link, set_show_link = solara.use_state(False)
    
    with solara.Column(gap="32px", style={"padding": "48px", "width": "100%", "max-width": "1200px"}):
        with solara.Row(justify="space-between", style={"align-items": "end"}):
            with solara.Column(gap="4px"):
                solara.Text("Portfolio Management", style={"font-size": "32px", "font-weight": "800", "letter-spacing": "-1px"})
                solara.Text("All linked bank and brokerage accounts", style={"font-size": "14px", "color": "rgba(255,255,255,0.5)"})
            solara.Button("Connect via Plaid", on_click=lambda: set_show_link(True), color="primary", style={"background": "#6366f1", "padding": "12px 24px", "border-radius": "12px"})

        if show_link:
            PlaidLink(lambda: set_show_link(False))

        with solara.Row(gap="24px", style={"flex-wrap": "wrap"}):
            for acc in accounts_data.value:
                with solara.Column(style={
                    "background": "rgba(255,255,255,0.03)", 
                    "padding": "32px", 
                    "border-radius": "32px", 
                    "min-width": "340px", 
                    "border": "1px solid rgba(255,255,255,0.05)",
                    "box-shadow": "0 20px 50px rgba(0,0,0,0.2)"
                }):
                    with solara.Row(justify="space-between", style={"width": "100%"}):
                        solara.Text(acc['bank'].upper(), style={"font-size": "10px", "color": "#6366f1", "font-weight": "800", "letter-spacing": "1.5px"})
                        solara.Text("ACTIVE", style={"font-size": "9px", "color": "#4ade80", "font-weight": "900"})
                    
                    solara.Text(acc['name'], style={"font-size": "22px", "font-weight": "600", "margin": "16px 0"})
                    
                    with solara.Row(justify="space-between", style={"align-items": "end"}):
                        solara.Text(f"${acc['balance']:,.2f}", style={"font-size": "32px", "font-weight": "800"})
                        solara.Text(acc['change'], style={"font-size": "12px", "color": "#4ade80", "font-weight": "700", "margin-bottom": "6px"})
                    
                    solara.HTML(tag="div", style={
                        "height": "1px", 
                        "background": "rgba(255,255,255,0.05)", 
                        "margin": "24px 0"
                    })
                    
                    with solara.Row(justify="space-between"):
                        solara.Text("SYNCED 2M AGO", style={"font-size": "9px", "color": "rgba(255,255,255,0.2)"})
                        solara.Text(acc['type'].upper(), style={"font-size": "9px", "color": "rgba(255,255,255,0.2)"})

@solara.component
def Page():
    solara.Style("""
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body { 
            background-color: #050505 !important; 
            color: white !important; 
            font-family: 'Inter', sans-serif !important; 
            margin: 0; 
            overflow-x: hidden;
        }
        
        /* Custom scrollbar for that premium feel */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #222; }

        .solara-content-main { background: transparent !important; }
        footer { display: none !important; }
    """)
    
    with solara.Row(style={"min-height": "100vh", "background": "#050505"}):
        Sidebar()
        with solara.Column(style={"flex": "1", "height": "100vh", "overflow-y": "auto", "background": "radial-gradient(circle at 50% 0%, #111 0%, #050505 100%)"}):
            if active_view.value == "dashboard":
                DashboardView()
            elif active_view.value == "accounts":
                AccountsView()
            else:
                with solara.Column(style={"padding": "48px"}):
                    solara.Text("Functional Module coming soon.", style={"color": "rgba(255,255,255,0.2)"})

app = Page()
