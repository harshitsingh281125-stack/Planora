import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import WeatherBg from '../../assets/images/WeatherBg.webp';
import Header from '../../components/Header';
import { formatEndDate, formatStartDate, formatWeather, getWeatherIcon } from '../../utils';
import { Loader2 } from 'lucide-react';

const TripPage = () => {
    const { tripId } = useParams();
    const currentTrip = JSON.parse(localStorage.getItem('trips'))?.find((trip) => trip.id === tripId);
    // eslint-disable-next-line no-unused-vars
    const [weatherData, setWeatherData] = useState([]); // Formatted weather data for UI display
    const [weatherLoading, setWeatherLoading] = useState(false);
    useEffect(() => {
        if (!tripId) return;


        if (!currentTrip || !currentTrip.destination || !currentTrip.startDate) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tripStartDate = new Date(currentTrip.startDate);
        tripStartDate.setHours(0, 0, 0, 0);

        const sixteenDaysFromToday = new Date(today);
        sixteenDaysFromToday.setDate(today.getDate() + 16);

        let apiUrl = '';
        let startDate = currentTrip.startDate;
        let endDate = currentTrip.endDate;

        if (tripStartDate <= today) {
            // Past dates - use Archive API
            apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${currentTrip.destination.latitude}&longitude=${currentTrip.destination.longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        } else if (tripStartDate <= sixteenDaysFromToday) {
            // Near future (within 16 days) - use Forecast API
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${currentTrip.destination.latitude}&longitude=${currentTrip.destination.longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        } else {
            // Far future - use Archive API with last year's dates
            const lastYearStartDate = new Date(tripStartDate);
            lastYearStartDate.setFullYear(tripStartDate.getFullYear() - 1);
            const lastYearEndDate = new Date(currentTrip.endDate);
            lastYearEndDate.setFullYear(lastYearEndDate.getFullYear() - 1);

            startDate = lastYearStartDate.toISOString().split('T')[0];
            endDate = lastYearEndDate.toISOString().split('T')[0];

            apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${currentTrip.destination.latitude}&longitude=${currentTrip.destination.longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
        }
        setWeatherLoading(true);
        fetch(apiUrl)
            .then((res) => res.json())
            .then((data) => {
                console.log('weather',data)
                const formattedWeather = formatWeather(data);
                const weatherWithIcons = formattedWeather.map((day) => ({
                    ...day,
                    icon: getWeatherIcon(day.rain)
                }));
                setWeatherData(weatherWithIcons);
            })
            .catch((err) => {
                console.log('err', err);
            }).finally(() => {
                setWeatherLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]);
    return (
        <div className='flex flex-col items-center w-full h-screen bg-gray-bg'>
            <Header title={currentTrip.name} backButton secondaryTitle={`${formatStartDate(currentTrip.startDate)} - ${formatEndDate(currentTrip.endDate)}`} onClickAI={() => { console.log('AI') }} />

            <div
                className={`${weatherLoading ? 'w-full' : 'w-fit'} bg-cover bg-center bg-no-repeat flex flex-row items-center justify-center gap-12 flex-wrap p-4 mt-8 rounded-2xl`}
                style={{ backgroundImage: `url(${WeatherBg})` }}
                role="img"
                aria-label="Weather Background"
            >
                {weatherLoading ? <div className='flex flex-col items-center justify-center w-full h-full gap-2'>
                    <Loader2 className='w-6 h-6 text-gray-800 animate-spin' />
                    <p className='text-lg font-medium'>Loading weather data...</p>
                </div> : null}
                {weatherData.map((day) => (
                    <div key={day.date} className='flex flex-col items-center justify-center'>
                        <h1 className='text-lg font-medium'>{`${formatStartDate(day.date)}: `}</h1>
                        <h1 className='text-4xl'>{day.icon}</h1>
                        <p className='text-lg font-medium'>{Math.round((day.tempMin + day.tempMax) / 2)}°C</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TripPage