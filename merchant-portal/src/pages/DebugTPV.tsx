import React, { useState } from 'react';
import { TPVHeader } from '../ui/design-system/domain/TPVHeader';
import { VoiceCommandService } from '../core/voice/VoiceCommandService';

export const DebugTPV = () => {
    const [isListening, setIsListening] = useState(false);
    const [wakeWord, setWakeWord] = useState('');
    const [svcInstance, setSvcInstance] = useState<VoiceCommandService | null>(null);

    // Simple mock of the hook logic
    const handleToggleVoice = () => {
        console.log('[DebugTPV] Toggling voice...');
        setIsListening(!isListening);

        if (!isListening) {
            console.log('[DebugTPV] Starting mock listening');
            // Try to use real service if available in browser
            try {
                // Use existing singleton or create new for debug
                const svc = new VoiceCommandService();
                svc.setWakeWord(wakeWord || undefined);
                setSvcInstance(svc);

                console.log('[DebugTPV] Service instantiated with Wake Word:', wakeWord || '(none)');
            } catch (e) {
                console.error('[DebugTPV] Service error', e);
            }
        } else {
            console.log('[DebugTPV] Mock listening stopped');
            setSvcInstance(null);
        }
    };

    return (
        <div style={{ padding: 20, background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
            <h1 id="debug-title">Debug TPV Page Loaded</h1>
            <p>If you see this, routing is working.</p>

            <div style={{ border: '1px solid #333', padding: 20, marginTop: 20, borderRadius: 8 }}>
                <h3>Component Preview:</h3>
                <TPVHeader
                    operatorName="Dev User"
                    terminalId="TERM-001"
                    isOnline={true}
                    restaurantName="Debug Kitchen"
                    voiceControl={{
                        isAvailable: true,
                        isListening: isListening,
                        onToggle: handleToggleVoice
                    }}
                />
            </div>

            <div style={{ border: '1px solid #333', padding: 20, marginTop: 20, borderRadius: 8 }}>
                <h3>Configuration:</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label>Wake Word:</label>
                    <input
                        type="text"
                        value={wakeWord}
                        onChange={(e) => setWakeWord(e.target.value)}
                        placeholder="e.g. Ok Computer"
                        style={{ padding: 8, background: '#333', border: 'none', color: 'white', borderRadius: 4 }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>(Empty = No Wake Word)</span>
                </div>
            </div>

            <div style={{ marginTop: 40 }}>
                <h3>Diagnostics:</h3>
                <ul>
                    <li>Speech Recognition Support: {typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition) ? '✅ Yes' : '❌ No'}</li>
                    <li>Speech Synthesis Support: {typeof window !== 'undefined' && window.speechSynthesis ? '✅ Yes' : '❌ No'}</li>
                </ul>
            </div>
        </div>
    );
};
