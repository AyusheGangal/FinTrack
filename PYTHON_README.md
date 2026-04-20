# Running your Python-Native Vault (Solara)

Since you wanted a Python-native web application that runs locally, I have moved the core logic to `main.py` using **Solara**.

## Prerequisites
1.  **Python 3.8+** installed on your machine.
2.  Your Plaid Credentials (`PLAID_CLIENT_ID` and `PLAID_SECRET`) in a `.env` file.

## Setup Instructions

1.  **Open your terminal** in this project folder.
2.  **Create a virtual environment** (Optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install the dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Launch the Application**:
    ```bash
    solara run main.py
    ```
5.  **Access the Vault**:
    The app will open automatically in your browser at `http://localhost:8765` (or similar).

## Key Features
-   **Pure Python**: Everything from the UI layout to the Plaid API logic is handled in `main.py`.
-   **Pandas & Plotly**: Built-in data processing and interactive charts for your Net Worth.
-   **Vault Aesthetic**: I've preserved the dark-mode, glassmorphism look using Solara's custom CSS styling.

## Note on Plaid Link
Plaid Link is a browser-based flow. In this Python version, I've added the placeholder logic for triggering the Plaid popup. When running locally, you'll see how Solara handles the Python-to-Browser bridge.
