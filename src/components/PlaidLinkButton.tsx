import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Shield, CheckCircle, Loader2 } from 'lucide-react';

interface PlaidLinkButtonProps {
  onSuccess: (publicToken: string, metadata: any) => void;
}

export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ onSuccess }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plaid/create_link_token', {
        method: 'POST',
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (err) {
      console.error('Error generating link token:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateToken();
  }, []);

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      onSuccess(public_token, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
        ready 
          ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20' 
          : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
      }`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Shield className="w-5 h-5" />
      )}
      <span className="font-medium">
        {loading ? 'Initializing Vault...' : 'Connect Bank via Plaid'}
      </span>
    </button>
  );
};
