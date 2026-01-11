// AI Modes
export const AI_MODES = {
    GENERATE: 'generate',
    IMPROVE: 'improve',
    FILL_GAPS: 'fill_gaps',
    SUGGEST: 'suggest'
};

// Mode options for radio buttons with default prompts
export const MODE_OPTIONS = [
    { 
        id: AI_MODES.GENERATE, 
        label: 'Generate Itinerary', 
        description: 'Create a new itinerary from scratch',
        defaultPrompt: 'Plan a complete itinerary with sightseeing, activities, and dining options'
    },
    { 
        id: AI_MODES.IMPROVE, 
        label: 'Improve Existing', 
        description: 'Enhance your current itinerary',
        defaultPrompt: 'Suggest better alternatives and add more authentic local experiences'
    },
    { 
        id: AI_MODES.FILL_GAPS, 
        label: 'Fill Missing Items', 
        description: 'Add activities to empty time slots',
        defaultPrompt: 'Fill empty morning, afternoon, and evening slots with activities and meals'
    },
    { 
        id: AI_MODES.SUGGEST, 
        label: 'Suggest Places', 
        description: 'Get restaurant & activity recommendations',
        defaultPrompt: 'Recommend the best local restaurants and must-do activities'
    }
];

// Get default prompt for a mode
export const getDefaultPrompt = (modeId) => {
    const option = MODE_OPTIONS.find(opt => opt.id === modeId);
    return option?.defaultPrompt || '';
};

