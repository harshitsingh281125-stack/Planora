import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { formatEndDate, formatStartDate, formatWeather, getDayOfDate, getWeatherIcon } from '../../utils';
import { fetchWeatherData } from '../../services/api';
import { Loader2, PlusIcon, Plane, Building2, Car, Ticket, UtensilsCrossed, MoreHorizontal, Pencil, Trash2, Check, Copy, AlertTriangle } from 'lucide-react';
import ActionButton from '../../components/ActionButton';
import AddItemModal from '../../components/AddItemModal';
import AIAssistModal from '../../components/AIAssistModal';
import { getTripWithItinerary, deleteItineraryItem, addMultipleItineraryItems, generateShareToken, getTripByShareToken, deleteTrip } from '../../services/tripsService';

const getItemIcon = (type) => {
    switch (type) {
        case 'flight': return Plane;
        case 'hotel': return Building2;
        case 'transport': return Car;
        case 'activity': return Ticket;
        case 'restaurant': return UtensilsCrossed;
        default: return MoreHorizontal;
    }
};

const getItemColor = (type) => {
    switch (type) {
        case 'flight': return 'bg-blue-500';
        case 'hotel': return 'bg-purple-500';
        case 'transport': return 'bg-yellow-500';
        case 'activity': return 'bg-green-500';
        case 'restaurant': return 'bg-orange-500';
        default: return 'bg-gray-500';
    }
};

const TripPage = () => {
    const { tripId, shareToken } = useParams();
    const navigate = useNavigate();
    const [currentTrip, setCurrentTrip] = useState(null);
    const [tripLoading, setTripLoading] = useState(true);
    const [tripError, setTripError] = useState(null);
    const [weatherData, setWeatherData] = useState([]);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showAIModal, setShowAIModal] = useState(false);
    const [shareLink, setShareLink] = useState(null);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const isSharedView = !!shareToken;

    const loadTrip = useCallback(async () => {
        if (isSharedView) {
            if (!shareToken) return;
            
            try {
                setTripLoading(true);
                setTripError(null);
                const trip = await getTripByShareToken(shareToken);
                setCurrentTrip(trip);
            } catch (err) {
                console.error('Error loading shared trip:', err);
                setTripError('Failed to load trip. The link may be invalid or expired.');
            } finally {
                setTripLoading(false);
            }
        } else {
            if (!tripId) return;
            
            try {
                setTripLoading(true);
                setTripError(null);
                const trip = await getTripWithItinerary(tripId);
                setCurrentTrip(trip);
            } catch (err) {
                console.error('Error loading trip:', err);
                setTripError('Failed to load trip. Please try again.');
            } finally {
                setTripLoading(false);
            }
        }
    }, [tripId, shareToken, isSharedView]);

    useEffect(() => {
        loadTrip();
    }, [loadTrip]);

    const getGroupedItinerary = () => {
        if (!currentTrip?.itinerary || currentTrip.itinerary.length === 0) return {};
        
        const grouped = {};
        currentTrip.itinerary.forEach((item) => {
            const date = item.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });

        Object.keys(grouped).forEach((date) => {
            grouped[date].sort((a, b) => {
                const timeA = a.startTime || '00:00';
                const timeB = b.startTime || '00:00';
                return timeA.localeCompare(timeB);
            });
        });

        const sortedGrouped = {};
        Object.keys(grouped).sort().forEach((date) => {
            sortedGrouped[date] = grouped[date];
        });

        return sortedGrouped;
    };

    const handleDeleteItem = async (itemId) => {
        try {
            await deleteItineraryItem(itemId);
            loadTrip();
        } catch (err) {
            console.error('Error deleting item:', err);
        }
    };

    const handleApplyAIItems = async (items) => {
        try {
            await addMultipleItineraryItems(tripId, items);
            loadTrip();
        } catch (err) {
            console.error('Error adding AI items:', err);
        }
    };

    const handleShare = async () => {
        try {
            const token = await generateShareToken(tripId);
            const shareUrl = `${window.location.origin}/share/${token}`;
            setShareLink(shareUrl);
            
            await navigator.clipboard.writeText(shareUrl);
            setShareLinkCopied(true);
            setTimeout(() => setShareLinkCopied(false), 3000);
        } catch (err) {
            console.error('Error generating share link:', err);
            alert('Failed to generate share link. Please try again.');
        }
    };

    const handleCopyLink = async () => {
        if (shareLink) {
            await navigator.clipboard.writeText(shareLink);
            setShareLinkCopied(true);
            setTimeout(() => setShareLinkCopied(false), 3000);
        }
    };

    const handleDeleteTrip = async () => {
        if (!tripId) return;
        
        try {
            setDeleting(true);
            await deleteTrip(tripId);
            navigate('/');
        } catch (err) {
            console.error('Error deleting trip:', err);
            alert('Failed to delete trip. Please try again.');
            setDeleting(false);
        }
    };

    const groupedItinerary = getGroupedItinerary();

    useEffect(() => {
        if (!tripId && !shareToken) return;
        if (!currentTrip || !currentTrip.destination || !currentTrip.startDate || !currentTrip.endDate) return;
        
        const destination = currentTrip.destination;
        if (typeof destination === 'object' && (!destination.latitude || !destination.longitude)) {
            setWeatherError('Destination coordinates not available');
            return;
        }
        if (typeof destination === 'string') {
            setWeatherError('Destination coordinates not available');
            return;
        }

        const loadWeather = async () => {
            setWeatherLoading(true);
            setWeatherError(null);
            
            try {
                const data = await fetchWeatherData(
                    currentTrip.destination,
                    currentTrip.startDate,
                    currentTrip.endDate
                );
                
                const formattedWeather = formatWeather(data);
                const weatherWithIcons = formattedWeather.map((day) => ({
                    ...day,
                    icon: getWeatherIcon(day.rain)
                }));
                setWeatherData(weatherWithIcons);
            } catch (err) {
                console.error('Weather fetch error:', err);
                setWeatherError('Unable to load weather data');
            } finally {
                setWeatherLoading(false);
            }
        };

        loadWeather();
    }, [tripId, shareToken, currentTrip]);

    if (tripLoading) {
        return (
            <div className='flex flex-col items-center justify-center w-full h-screen bg-gray-bg'>
                <Loader2 className='w-10 h-10 text-cyan-500 animate-spin' />
                <p className='mt-4 text-gray-600'>Loading trip...</p>
            </div>
        );
    }

    if (tripError) {
        return (
            <div className='flex flex-col items-center justify-center w-full h-screen bg-gray-bg'>
                <p className='text-red-600 mb-4'>{tripError}</p>
                <button 
                    onClick={loadTrip}
                    className='px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600'
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!currentTrip) {
        return (
            <div className='flex flex-col items-center justify-center w-full h-screen bg-gray-bg'>
                <p className='text-gray-600'>Trip not found</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col items-center w-full h-screen bg-gray-bg'>
            <AddItemModal 
                isOpen={showAddItemModal} 
                onClose={(saved = false) => {
                    setShowAddItemModal(false);
                    setEditingItem(null);
                    if (saved) {
                        loadTrip();
                    }
                }} 
                tripId={tripId}
                tripStartDate={currentTrip?.startDate}
                editingItem={editingItem}
            />
            <AIAssistModal 
                isOpen={showAIModal} 
                onClose={() => setShowAIModal(false)}
                tripContext={{
                    destination: currentTrip?.destination?.name || currentTrip?.destination,
                    startDate: currentTrip?.startDate,
                    endDate: currentTrip?.endDate,
                    itinerary: currentTrip?.itinerary || [],
                }}
                onApply={handleApplyAIItems}
            />
            <Header 
                title={currentTrip?.name} 
                backButton 
                secondaryTitle={`${formatStartDate(currentTrip?.startDate)} - ${formatEndDate(currentTrip?.endDate)}`} 
                onClickAI={() => setShowAIModal(true)}
                onShare={handleShare}
                isSharedView={isSharedView}
            />
            
            {!isSharedView && (
                <div className="w-full px-4 md:px-20 mt-4 flex justify-end">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Delete Trip</span>
                    </button>
                </div>
            )}
            
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => !deleting && setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold">Delete Trip</h2>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <span className="font-semibold">"{currentTrip?.name}"</span>? 
                            This action cannot be undone and will delete all itinerary items associated with this trip.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteTrip}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {shareLink && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShareLink(null)}>
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Share Trip</h2>
                        <p className="text-sm text-gray-600 mb-4">Anyone with this link can view your trip:</p>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center gap-2 transition-colors"
                            >
                                {shareLinkCopied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <button
                            onClick={() => setShareLink(null)}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className='flex flex-col items-center w-full flex-1 overflow-y-auto'>
                <div
                    className="overflow-x-auto p-4 mt-6 mx-4 md:mx-20 rounded-2xl shadow-lg border border-white/20 flex-shrink-0"
                    style={{ 
                        background: 'linear-gradient(135deg, #89CFF0 0%, #A7D8FF 25%, #FFE5B4 50%, #FFDAB9 75%, #FFC8A2 100%)'
                    }}
                    role="region"
                    aria-label="Weather Forecast"
                >
                    <div className="flex flex-row items-center justify-center gap-2 px-2">
                        {weatherLoading ? (
                            <div className='flex flex-col items-center justify-center py-3 gap-2 w-full min-w-[280px]'>
                                <Loader2 className='w-6 h-6 text-cyan-600 animate-spin' />
                                <p className='text-sm font-medium text-gray-600'>Loading weather...</p>
                            </div>
                        ) : weatherError ? (
                            <div className='flex flex-col items-center justify-center py-3 gap-1 w-full min-w-[280px]'>
                                <span className='text-2xl'>⚠️</span>
                                <p className='text-sm font-medium text-gray-600'>{weatherError}</p>
                                <button 
                                    onClick={() => window.location.reload()}
                                    className='text-xs text-cyan-600 hover:text-cyan-700 underline'
                                >
                                    Try again
                                </button>
                            </div>
                        ) : weatherData.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-3 gap-1 w-full min-w-[280px]'>
                                <span className='text-2xl'>🌤️</span>
                                <p className='text-sm font-medium text-gray-600'>Weather data unavailable</p>
                            </div>
                        ) : (
                            weatherData.map((day) => (
                                <div key={day.date} className='flex flex-col items-center justify-center min-w-[70px] p-2 rounded-lg hover:bg-white/30 transition-colors flex-shrink-0'>
                                    <p className='text-[10px] font-medium text-gray-600 mb-0.5'>{formatStartDate(day.date)}</p>
                                    <span className='text-2xl mb-0.5'>{day.icon}</span>
                                    <p className='text-xs font-bold text-gray-800'>{Math.round((day.tempMin + day.tempMax) / 2)}°C</p>
                                    <p className='text-[9px] text-gray-500'>{Math.round(day.tempMin)}°/{Math.round(day.tempMax)}°</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className='flex flex-col items-start justify-start w-full gap-2 mt-8 px-4 md:px-20 pb-20'>
                {Object.keys(groupedItinerary).length > 0 ? (
                    Object.entries(groupedItinerary).map(([date, items]) => (
                        <div key={date} className="w-full max-w-2xl mb-8">
                            <h2 className='text-xl lg:text-2xl font-bold border-b-2 border-black pb-2 mb-4'>
                                {`${formatStartDate(date)}, ${getDayOfDate(date)}`}
                            </h2>
                            
                            <div className="relative pl-8">
                                {items.map((item, index) => {
                                    const Icon = getItemIcon(item.type);
                                    const colorClass = getItemColor(item.type);
                                    const isLastItem = index === items.length - 1;
                                    
                                    return (
                                        <div key={item.id} className="relative pb-6">
                                            {!isLastItem && (
                                                <div className="absolute left-4 top-12 w-0.5 h-full bg-gray-300 -translate-x-1/2" />
                                            )}
                                            
                                            <div className={`absolute left-4 top-4 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center -translate-x-1/2 z-10`}>
                                                <Icon className="w-4 h-4 text-white" />
                                            </div>
                                            
                                            <div className="absolute left-8 top-7 w-6 h-0.5 bg-gray-300" />
                                            
                                            <div className="ml-16 group">
                                                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative">
                                                    <div className="absolute left-0 top-5 -translate-x-full">
                                                        <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-200" />
                                                        <div className="absolute top-0 left-[1px] w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white" />
                                                    </div>
                                                    {!isSharedView && (
                                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-500"
                                                                onClick={() => {
                                                                    setEditingItem(item);
                                                                    setShowAddItemModal(true);
                                                                }}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-500"
                                                                onClick={() => handleDeleteItem(item.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="text-sm text-gray-500 mb-1">
                                                        {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
                                                    </div>
                                                    
                                                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                                    
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {item.type === 'flight' && (
                                                            <p>{item.details?.airline} • PNR: {item.details?.pnr}</p>
                                                        )}
                                                        {item.type === 'hotel' && (
                                                            <p>{item.details?.address}</p>
                                                        )}
                                                        {item.type === 'transport' && (
                                                            <p>{item.details?.mode}: {item.details?.from} → {item.details?.to}</p>
                                                        )}
                                                        {item.type === 'activity' && (
                                                            <p>{item.details?.category}</p>
                                                        )}
                                                        {item.type === 'restaurant' && (
                                                            <p>{item.details?.cuisine}</p>
                                                        )}
                                                        {item.type === 'other' && item.details?.description && (
                                                            <p>{item.details.description}</p>
                                                        )}
                                                    </div>
                                                    
                                                    {item.notes && (
                                                        <p className="text-xs text-gray-400 mt-2 italic">📝 {item.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 text-center w-full max-w-2xl py-8">
                        No items added yet. Click "Add Item" to start planning your trip!
                    </div>
                )}
                
                {!isSharedView && (
                    <div className="w-full max-w-2xl">
                        <ActionButton 
                            label="Add Item" 
                            onClick={() => setShowAddItemModal(true)} 
                            className="w-fit px-4 py-2" 
                            icon={PlusIcon}
                        />
                    </div>
                )}
                </div>
            </div>
        </div>
    )
}

export default TripPage
