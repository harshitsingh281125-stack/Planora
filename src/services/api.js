import { supabase } from '../lib/supabase';

export const searchCities = async (query, countryCode = 'IN') => {
    if (!query || query.trim().length === 0) {
        return [];
    }

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&country=${countryCode}&count=10`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch city results');
        }

        const data = await response.json();
        
        const filteredResults = (data.results || []).filter(
            (city) => city.country_code === countryCode
        );

        return filteredResults;
    } catch (error) {
        console.error('City search error:', error);
        return [];
    }
};

export const searchAddresses = async (query) => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`,
            {
                headers: {
                    'Accept-Language': 'en',
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch address results');
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Address search error:', error);
        return [];
    }
};

const getWeatherApiConfig = (destination, tripStartDate, tripEndDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(tripEndDate);
    endDate.setHours(0, 0, 0, 0);

    const sixteenDaysFromToday = new Date(today);
    sixteenDaysFromToday.setDate(today.getDate() + 16);

    const baseParams = `latitude=${destination.latitude}&longitude=${destination.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    if (endDate < today) {
        // Trip already ended - use Archive API
        return {
            url: `https://archive-api.open-meteo.com/v1/archive?${baseParams}&start_date=${tripStartDate}&end_date=${tripEndDate}`,
            startDate: tripStartDate,
            endDate: tripEndDate,
            isHistorical: true
        };
    } else if (endDate <= sixteenDaysFromToday) {
        // Trip ends within 16 days - use Forecast API
        return {
            url: `https://api.open-meteo.com/v1/forecast?${baseParams}&start_date=${tripStartDate}&end_date=${tripEndDate}`,
            startDate: tripStartDate,
            endDate: tripEndDate,
            isHistorical: false
        };
    } else {
        // Trip ends beyond 16 days - use Archive API with last year's dates
        const startDateObj = new Date(tripStartDate);
        const lastYearStartDate = new Date(startDateObj);
        lastYearStartDate.setFullYear(startDateObj.getFullYear() - 1);
        
        const lastYearEndDate = new Date(tripEndDate);
        lastYearEndDate.setFullYear(lastYearEndDate.getFullYear() - 1);

        const lastYearStart = lastYearStartDate.toISOString().split('T')[0];
        const lastYearEnd = lastYearEndDate.toISOString().split('T')[0];

        return {
            url: `https://archive-api.open-meteo.com/v1/archive?${baseParams}&start_date=${lastYearStart}&end_date=${lastYearEnd}`,
            startDate: lastYearStart,
            endDate: lastYearEnd,
            isHistorical: true,
            isLastYearData: true
        };
    }
};

export const fetchWeatherData = async (destination, startDate, endDate) => {
    if (!destination || !destination.latitude || !destination.longitude) {
        throw new Error('Invalid destination coordinates');
    }

    if (!startDate || !endDate) {
        throw new Error('Invalid date range');
    }

    const config = getWeatherApiConfig(destination, startDate, endDate);

    try {
        const response = await fetch(config.url);

        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        return {
            ...data,
            meta: {
                isHistorical: config.isHistorical,
                isLastYearData: config.isLastYearData || false
            }
        };
    } catch (error) {
        console.error('Weather fetch error:', error);
        throw error;
    }
};

export const callAIProxy = async (mode, tripContext, prompt) => {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            throw new Error('You must be logged in to use AI features');
        }

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        
        if (!supabaseUrl) {
            throw new Error('Supabase URL not configured');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || ''
            },
            body: JSON.stringify({
                mode,
                tripContext,
                prompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response from AI');
        }

        const data = await response.json();
        return {
            content: data.content || '',
            finishReason: data.finishReason
        };
    } catch (error) {
        console.error('AI Proxy error:', error);
        throw error;
    }
};

