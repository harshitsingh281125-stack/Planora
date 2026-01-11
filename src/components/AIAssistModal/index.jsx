import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { Sparkles, Loader2 } from 'lucide-react';
import { AI_MODES, MODE_OPTIONS, getDefaultPrompt } from './constants';
import { callAIProxy } from '../../services/api';

const itemToReadableText = (item) => {
    const time = item.startTime ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}` : '';
    const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    
    switch (item.type) {
        case 'flight':
            return `${dateStr} ${time}: ✈️ Flight from ${item.details?.from || ''} to ${item.details?.to || ''}${item.details?.airline ? ` (${item.details.airline})` : ''}`;
        case 'hotel':
            return `${dateStr}: 🏨 Check-in at ${item.details?.hotelName || item.title}${item.details?.address ? ` - ${item.details.address}` : ''}`;
        case 'transport':
            return `${dateStr} ${time}: 🚗 ${item.details?.mode || 'Transport'} from ${item.details?.from || ''} to ${item.details?.to || ''}`;
        case 'activity':
            return `${dateStr} ${time}: 🎫 ${item.title || item.details?.place}${item.details?.category ? ` (${item.details.category})` : ''}`;
        case 'restaurant':
            return `${dateStr} ${time}: 🍴 ${item.details?.restaurantName || item.title}${item.details?.cuisine ? ` - ${item.details.cuisine}` : ''}`;
        case 'other':
            return `${dateStr} ${time}: 📌 ${item.title}${item.details?.description ? ` - ${item.details.description}` : ''}`;
        default:
            return `${dateStr} ${time}: ${item.title}`;
    }
};

const AIAssistModal = ({ isOpen, onClose, onApply, tripContext }) => {
    const hasExistingItems = (tripContext?.itinerary?.length || 0) > 0;
    
    const [prompt, setPrompt] = useState('');
    const [mode, setMode] = useState(AI_MODES.GENERATE);
    const [displayResults, setDisplayResults] = useState([]);
    
    useEffect(() => {
        if (isOpen) {
            const initialMode = hasExistingItems ? AI_MODES.IMPROVE : AI_MODES.GENERATE;
            setMode(initialMode);
            setPrompt(getDefaultPrompt(initialMode));
        }
    }, [isOpen, hasExistingItems]);
    
    const handleModeChange = (newMode) => {
        if (newMode === AI_MODES.GENERATE && hasExistingItems) return;
        setMode(newMode);
        setPrompt(getDefaultPrompt(newMode));
    };
    const [generatedItems, setGeneratedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRunAI = async () => {
        if (!prompt.trim()) return;
        
        setIsLoading(true);
        setError('');
        setDisplayResults([]);
        setGeneratedItems([]);

        try {
            const response = await callAIProxy(mode, tripContext, prompt);
            const { content: text, finishReason } = response;

            if (!text) {
                throw new Error('Empty response from AI');
            }

            let jsonText = text;
            
            const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlockMatch) {
                jsonText = codeBlockMatch[1];
            }
            
            let jsonMatch = jsonText.match(/\[[\s\S]*\]/);
            
            if (!jsonMatch && finishReason === 'length') {
                const incompleteMatch = jsonText.match(/\[[\s\S]*/);
                if (incompleteMatch) {
                    let truncatedJson = incompleteMatch[0];
                    const lastCompleteObject = truncatedJson.lastIndexOf('}');
                    if (lastCompleteObject > 0) {
                        truncatedJson = truncatedJson.substring(0, lastCompleteObject + 1) + ']';
                        jsonMatch = [truncatedJson];
                        console.warn('AI response was truncated, recovered partial items');
                    }
                }
            }
            
            if (!jsonMatch) {
                throw new Error('Could not parse AI response as JSON. Try a shorter request.');
            }

            let items;
            try {
                items = JSON.parse(jsonMatch[0]);
            } catch (parseErr) {
                console.error('JSON parse error:', parseErr, 'Text:', jsonMatch[0]);
                throw new Error('AI generated invalid JSON. Please try again with a simpler request.');
            }
            
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error('AI did not generate any items');
            }

            setGeneratedItems(items);
            
            const readableResults = items.map(item => itemToReadableText(item));
            setDisplayResults(readableResults);

        } catch (err) {
            console.error('AI Error:', err);
            setError(err.message || 'Failed to generate itinerary. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = () => {
        if (onApply && generatedItems.length > 0) {
            onApply(generatedItems);
        }
        handleClose();
    };

    const handleClose = () => {
        const resetMode = hasExistingItems ? AI_MODES.IMPROVE : AI_MODES.GENERATE;
        setMode(resetMode);
        setPrompt(getDefaultPrompt(resetMode));
        setDisplayResults([]);
        setGeneratedItems([]);
        setError('');
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="AI Itenary Assistant"
            width="lg"
            showCloseButton={true}
        >
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                    {MODE_OPTIONS.map((option) => {
                        const isDisabled = option.id === AI_MODES.GENERATE && hasExistingItems;
                        return (
                            <div key={option.id} className="flex flex-col">
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                        isDisabled
                                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                            : mode === option.id
                                            ? 'border-cyan-500 bg-cyan-50 cursor-pointer'
                                            : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="aiMode"
                                        value={option.id}
                                        checked={mode === option.id}
                                        onChange={(e) => handleModeChange(e.target.value)}
                                        disabled={isDisabled}
                                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                    />
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-medium ${
                                            isDisabled 
                                                ? 'text-gray-400' 
                                                : mode === option.id 
                                                ? 'text-cyan-700' 
                                                : 'text-gray-700'
                                        }`}>
                                            {option.label}
                                        </span>
                                        <span className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {option.description}
                                        </span>
                                    </div>
                                </label>
                                {isDisabled && (
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                        Disabled: You already have items in your itinerary
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {mode !== AI_MODES.GENERATE && (
                    <div className={`text-xs px-3 py-2 rounded-lg ${
                        (tripContext?.itinerary?.length) > 0
                            ? 'bg-green-50 text-green-700'
                            : 'bg-yellow-50 text-yellow-700'
                    }`}>
                        {(tripContext?.itinerary?.length) > 0
                            ? `✓ Will analyze ${tripContext?.itinerary?.length} existing items in your itinerary`
                            : '⚠ No existing items in itinerary. Consider using "Generate Itinerary" first.'
                        }
                    </div>
                )}

                <div>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        rows={3}
                        placeholder="Describe what you'd like..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <button
                    className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleRunAI}
                    disabled={!prompt.trim() || isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Run AI
                        </>
                    )}
                </button>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="min-h-[200px] max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                            <p>Generating your itinerary...</p>
                            <p className="text-xs text-gray-400">This may take a few seconds</p>
                        </div>
                    ) : displayResults.length > 0 ? (
                        <ul className="space-y-3">
                            {displayResults.map((result, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-cyan-500 mt-0.5 font-bold">•</span>
                                    <span className="text-gray-700 text-sm">{result}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                            <Sparkles className="w-8 h-8 text-gray-300" />
                            <p>AI suggestions will appear here</p>
                        </div>
                    )}
                </div>

                {generatedItems.length > 0 && !isLoading && (
                    <button
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        onClick={handleApply}
                    >
                        Apply {generatedItems.length} items to Trip
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default AIAssistModal;
