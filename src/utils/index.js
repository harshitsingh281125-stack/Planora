export const formatStartDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
};

export const formatEndDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};
export const formatWeather = (data) => {
    if (!data || !data.daily) return [];

    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily;

    return time.map((date, i) => ({
        date,
        tempMax: temperature_2m_max[i],
        tempMin: temperature_2m_min[i],
        rain: precipitation_sum[i]
    }));
};

export const getWeatherIcon = (rain) => {
    if (rain === 0) return "☀️";
    if (rain < 1) return "⛅";
    return "🌧️";
};

export const getDayOfDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
};