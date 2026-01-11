
import React from 'react';
import { useOnboardingEngine } from '../context/OnboardingEngineProvider';

interface SceneAdapterProps {
    legacyComponent: React.ComponentType<any>;
    sceneId: string;
    mapOutputs: (legacyState: any) => void;
}

/**
 * SceneAdapter (The Bridge)
 * Allows mounting a Legacy Setup Screen inside the Cinematic Context.
 * Captures data via a proxy or manual mapping and feeds the Engine.
 */
export const SceneAdapter: React.FC<SceneAdapterProps> = ({ legacyComponent: LegacyComponent, mapOutputs: _mapOutputs }) => {
    const { engine: _engine } = useOnboardingEngine();

    // In a real implementation, we would monkey-patch localStorage or 
    // provide a mock context to the legacy component to intercept its writes.
    // For now, it serves as a structural wrapper.

    return (
        <div className="scene-adapter opacity-50 pointer-events-none grayscale">
            <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-2">Legacy Component Adapter</div>
            <LegacyComponent />
        </div>
    );
};
