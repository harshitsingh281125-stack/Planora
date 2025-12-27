import React, { useEffect, useState } from 'react';

const CreateTripModal = ({setShowCreateTripModal}) => {
    const [tripDestinationHint, setTripDestinationHint] = useState('');
    const [showCityResults, setShowCityResults] = useState(false);
    const [cityResults, setCityResults] = useState([]);
    const [createTripFormData, setCreateTripFormData] = useState({})
    const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);

    const getCityResults = (tripDestinationHint) => {
        fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${tripDestinationHint}&country=IN&count=10`,
        )
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error('Failed to fetch city results');
            }).then((data) => {
                const filteredCityResults = data.results.filter((city) => {
                    return city.country_code === 'IN' ? city : null;
                })
                setShowCityResults(filteredCityResults.length > 0);
                setCityResults(filteredCityResults);
            }).catch((error) => {
                console.error(error);
                setCityResults([]);
                setShowCityResults(false);
            });
    }

    useEffect(() => {
        if (tripDestinationHint.length === 0) {
            setShowCityResults(false);
            setCityResults([]);
            return;
        }

        const debounceTimer = setTimeout(() => {
            getCityResults(tripDestinationHint);
        }, 500);

        return () => {
            clearTimeout(debounceTimer);
        };
    }, [tripDestinationHint]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const imageUrl = reader.result;
                setCoverPhotoPreview(imageUrl);
                setCreateTripFormData((prev) => ({ ...prev, coverPhoto: imageUrl }));
            };
            reader.readAsDataURL(file);
        }
    };

    const generateTripId = () => {
        return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const handleCreateTrip = () => {
        if (!createTripFormData.name || !createTripFormData.destination || !createTripFormData.startDate || !createTripFormData.endDate) {
            return;
        }
        const tripData = {
            id: generateTripId(),
            name: createTripFormData.name || '',
            destination: createTripFormData.destination || '',
            startDate: createTripFormData.startDate || '',
            endDate: createTripFormData.endDate || '',
            coverPhoto: createTripFormData.coverPhoto || '',
            itenary: [],
        };

        // Get existing trips from localStorage
        const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
        
        // Add new trip
        existingTrips.push(tripData);
        
        // Save back to localStorage
        localStorage.setItem('trips', JSON.stringify(existingTrips));
        
        console.log('Trip saved to localStorage:', tripData);
        
        // Reset form
        setCreateTripFormData({});
        setTripDestinationHint('');
        setCoverPhotoPreview(null);
        
        // TODO: Close modal or show success message
        setShowCreateTripModal(false);
    };

    return (
        <>
            <style>{`
            input[type="date"]:invalid::-webkit-datetime-edit {
                color: transparent;
            }
            input[type="date"]:invalid::-webkit-datetime-edit::-webkit-selection {
                background-color: transparent;
                color: transparent;
            }
            input[type="date"]:invalid::-webkit-datetime-edit::selection {
                background-color: transparent;
                color: transparent;
            }
            input[type="date"]:invalid::-moz-selection {
                background-color: transparent;
                color: transparent;
            }
        `}</style>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                <div className="bg-white p-8 rounded-lg w-full max-w-sm">
                    <h2 className="text-2xl font-bold mb-4">Create New Trip</h2>
                    <div className='text-sm font-medium mb-1'>Trip Name</div>
                    <input type="text" placeholder="e.g. Summer Vacation" className="w-full py-1 px-2 border border-gray-300 rounded-md mb-4" value={createTripFormData.name || ''} onChange={(e) => {
                        setCreateTripFormData((prev)=>({...prev, name: e.target.value}));
                    }}/>
                    <div className='text-sm font-medium mb-1'>Destination</div>
                    <div className="relative">
                        <input type="text" placeholder="Search for a city" className="w-full py-1 px-2 border border-gray-300 rounded-md mb-4" value={tripDestinationHint} onChange={(e) => {
                            setTripDestinationHint(e.target.value);
                        }} />
                        {showCityResults && cityResults.length > 0 && (
                            <div className='absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto'>
                                {cityResults.map((city, index) => (
                                    <div key={city.place_id || index} className='text-sm font-medium p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0' role='button' onClick={() => {  
                                        setCreateTripFormData((prev)=>({...prev, destination: city}));
                                        setTripDestinationHint(`${city.name}, ${city.admin1}, ${city.country}`);
                                        setShowCityResults(false);
                                    }}>
                                        {`${city.name}, ${city.admin1}, ${city.country}`}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className='flex grid-cols-2 gap-2'>
                        <div className='flex flex-col'>
                            <div className='text-sm font-medium mb-1'>Start Date</div>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={createTripFormData.startDate}
                                    onChange={(e) => {
                                        setCreateTripFormData((prev)=>({...prev, startDate: e.target.value}));
                                    }}
                                    className={`w-full py-1 px-2 border border-gray-300 rounded-md mb-4 ${!createTripFormData.startDate ? 'text-transparent select-none' : 'text-gray-900'}`}
                                />
                                {!createTripFormData.startDate && (
                                    <span className="absolute left-2 top-2 text-gray-400 pointer-events-none text-sm">
                                        Select Date
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className='flex flex-col'>
                            <div className='text-sm font-medium mb-1'>End Date</div>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={createTripFormData.endDate}
                                    onChange={(e) => {
                                        setCreateTripFormData((prev)=>({...prev, endDate: e.target.value}));
                                    }}
                                    className={`w-full py-1 px-2 border border-gray-300 rounded-md mb-4 ${!createTripFormData.endDate ? 'text-transparent select-none' : 'text-gray-900'}`}
                                />
                                {!createTripFormData.endDate && (
                                    <span className="absolute left-2 top-2 text-gray-400 pointer-events-none text-sm">
                                        Select Date
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-center mb-2'>
                        <label className='flex flex-row items-center justify-center border-gray-300 border-1 shadow-md w-full bg-gray-100 text-sm font-bold py-1 px-2 rounded-md cursor-pointer'>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            {coverPhotoPreview ? 'Change Cover Photo' : 'Add Cover Photo (Optional)'}
                        </label>
                    </div>
                    {coverPhotoPreview && (
                        <div className='mb-4'>
                            <img 
                                src={coverPhotoPreview} 
                                alt="Cover preview" 
                                className='w-full h-32 object-cover rounded-md'
                            />
                        </div>
                    )}
                    <div className='flex flex-row justify-end gap-2'>
                        <button 
                            className='bg-transparent text-sm text-gray-900 py-1 px-2 rounded-md'
                            onClick={() => {
                                setCreateTripFormData({});
                                setTripDestinationHint('');
                                setCoverPhotoPreview(null);
                                setShowCreateTripModal(false);
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            className="bg-cyan-500 text-sm text-white py-1 px-2 rounded-md"
                            onClick={handleCreateTrip}
                        >
                            Create Trip
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default CreateTripModal;