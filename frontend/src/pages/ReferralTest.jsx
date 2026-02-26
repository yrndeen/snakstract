import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

function ReferralTest() {
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [referralCode, setReferralCode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { writeContract: setReferrerOnChain } = useWriteContract({
    onSuccess: (data) => {
      setError(null);
      setIsProcessing(false);
      setSuccess('Referral activated successfully!');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    },
    onError: (err) => {
      console.error('Failed to set referrer:', err);
      setError(err.message || 'Failed to activate referral code');
      setIsProcessing(false);
    }
  });

  useEffect(() => {
    // Check if URL path contains a referral code (5-character alphanumeric)
    // Format: snakstract.io/ABCDE
    const path = location.pathname;
    console.log('Current path:', path);
    
    const referralMatch = path.match(/^\/([A-Z0-9]{5})$/);
    console.log('Referral match:', referralMatch);
    
    if (referralMatch) {
      const code = referralMatch[1];
      setReferralCode(code);
      console.log('Found referral code:', code);
      
      // If wallet is connected, try to set the referrer
      if (isConnected && address) {
        handleReferralActivation(code);
      }
    }
  }, [location.pathname, isConnected, address]);

  const handleReferralActivation = async (code) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('Activating referral code:', code);
      await setReferrerOnChain({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'setReferrer',
        args: [code],
      });
    } catch (error) {
      console.error('Failed to activate referral:', error);
      setError('Failed to activate referral code: ' + (error.message || 'Unknown error'));
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #181c2b 0%, #0f1419 100%)',
      color: '#00ffcc',
      fontFamily: 'Orbitron, monospace',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ marginBottom: '2rem', textShadow: '0 0 10px #00ffcc' }}>
          Referral System Test
        </h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3>Current URL Path:</h3>
          <p style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
            {location.pathname}
          </p>
        </div>

        {referralCode && (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Detected Referral Code:</h3>
            <p style={{ fontFamily: 'monospace', background: 'rgba(0,255,204,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #00ffcc' }}>
              {referralCode}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3>Wallet Status:</h3>
          <p>Connected: {isConnected ? '✅ Yes' : '❌ No'}</p>
          {address && <p>Address: {address}</p>}
        </div>

        {isProcessing && (
          <div style={{ marginBottom: '2rem' }}>
            <h3>Processing Referral...</h3>
            <p>Please wait while we activate your referral code.</p>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '2rem', color: '#ff4444', padding: '1rem', background: 'rgba(255, 68, 68, 0.1)', borderRadius: '8px' }}>
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div style={{ marginBottom: '2rem', color: '#00ff44', padding: '1rem', background: 'rgba(0, 255, 68, 0.1)', borderRadius: '8px' }}>
            <h3>Success:</h3>
            <p>{success}</p>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3>Test URLs:</h3>
          <p>Try these URLs to test the referral system:</p>
          <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="/ABCDE" style={{ color: '#00ffcc', textDecoration: 'underline' }}>
                snakstract.io/ABCDE
              </a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="/12345" style={{ color: '#00ffcc', textDecoration: 'underline' }}>
                snakstract.io/12345
              </a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="/TEST1" style={{ color: '#00ffcc', textDecoration: 'underline' }}>
                snakstract.io/TEST1
              </a>
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Manual Test:</h3>
          <p>Test referral activation manually:</p>
          <input
            type="text"
            placeholder="Enter 5-character referral code"
            value={referralCode || ''}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase().slice(0, 5))}
            style={{
              padding: '0.5rem',
              marginRight: '1rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid #00ffcc',
              borderRadius: '4px',
              color: '#00ffcc',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={() => handleReferralActivation(referralCode)}
            disabled={!referralCode || referralCode.length !== 5 || !isConnected}
            style={{
              background: isConnected && referralCode && referralCode.length === 5 ? '#00ffcc' : '#666',
              color: '#000',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: isConnected && referralCode && referralCode.length === 5 ? 'pointer' : 'not-allowed',
              fontFamily: 'Orbitron, monospace'
            }}
          >
            Test Referral
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            background: '#00ffcc',
            color: '#000',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '8px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontFamily: 'Orbitron, monospace'
          }}
        >
          Go to Main Page
        </button>
      </div>
    </div>
  );
}

export default ReferralTest; 