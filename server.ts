import express from 'express';
import path from 'path';
import cors from 'cors';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Plaid Client initialization
let client: PlaidApi | null = null;

function getPlaidClient() {
  if (!client) {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;

    if (!clientId || !secret) {
      console.warn('Plaid environment variables (PLAID_CLIENT_ID, PLAID_SECRET) are missing. Plaid features will be disabled.');
      return null;
    }

    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });
    client = new PlaidApi(configuration);
  }
  return client;
}

// Plaid API Routes
app.post('/api/plaid/create_link_token', async (req, res) => {
  const plaidClient = getPlaidClient();
  if (!plaidClient) {
    return res.status(503).json({ error: 'Plaid is not configured on this server.' });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'user-id' }, // In a real app, use the Firebase UID
      client_name: 'FinTrack Pro',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Plaid Link Token Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plaid/exchange_public_token', async (req, res) => {
  const { public_token } = req.body;
  const plaidClient = getPlaidClient();
  if (!plaidClient) {
    return res.status(503).json({ error: 'Plaid is not configured on this server.' });
  }

  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    // In a production app, you would save accessToken and itemId to Firestore
    // linked to the authenticated user.
    res.json({ access_token: accessToken, item_id: itemId });
  } catch (error: any) {
    console.error('Plaid Token Exchange Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
