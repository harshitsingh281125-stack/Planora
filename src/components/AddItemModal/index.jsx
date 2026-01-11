import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import { Plane, Building2, Car, Ticket, UtensilsCrossed, MoreHorizontal, Loader2 } from 'lucide-react';
import airportsData from '../../data/airports.json';
import { searchAddresses } from '../../services/api';
import { addItineraryItem, updateItineraryItem } from '../../services/tripsService';

const ITEM_TYPES = [
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'hotel', label: 'Hotel', icon: Building2 },
    { id: 'transport', label: 'Transport', icon: Car },
    { id: 'activity', label: 'Activity', icon: Ticket },
    { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
    { id: 'other', label: 'Other', icon: MoreHorizontal },
];

const TIME_OPTIONS = [
    '00:00', '00:15', '00:30', '00:45',
    '01:00', '01:15', '01:30', '01:45',
    '02:00', '02:15', '02:30', '02:45',
    '03:00', '03:15', '03:30', '03:45',
    '04:00', '04:15', '04:30', '04:45',
    '05:00', '05:15', '05:30', '05:45',
    '06:00', '06:15', '06:30', '06:45',
    '07:00', '07:15', '07:30', '07:45',
    '08:00', '08:15', '08:30', '08:45',
    '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45',
    '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45',
    '17:00', '17:15', '17:30', '17:45',
    '18:00', '18:15', '18:30', '18:45',
    '19:00', '19:15', '19:30', '19:45',
    '20:00', '20:15', '20:30', '20:45',
    '21:00', '21:15', '21:30', '21:45',
    '22:00', '22:15', '22:30', '22:45',
    '23:00', '23:15', '23:30', '23:45',
];

const AddItemModal = ({ isOpen, onClose, tripId, tripStartDate, editingItem }) => {
    const [selectedType, setSelectedType] = useState('flight');
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    const [fromHint, setFromHint] = useState('');
    const [toHint, setToHint] = useState('');
    const [fromResults, setFromResults] = useState([]);
    const [toResults, setToResults] = useState([]);
    const [showFromResults, setShowFromResults] = useState(false);
    const [showToResults, setShowToResults] = useState(false);

    const [addressHint, setAddressHint] = useState('');
    const [addressResults, setAddressResults] = useState([]);
    const [showAddressResults, setShowAddressResults] = useState(false);

    useEffect(() => {
        if (editingItem && isOpen) {
            setSelectedType(editingItem.type);
            
            if (editingItem.type === 'flight') {
                setFormData({
                    from: { city: editingItem.details?.from, iata: editingItem.details?.fromIata, lat: editingItem.location?.lat, lon: editingItem.location?.lon },
                    to: { city: editingItem.details?.to, iata: editingItem.details?.toIata },
                    airline: editingItem.details?.airline || '',
                    pnr: editingItem.details?.pnr || '',
                    date: editingItem.date || '',
                    departureTime: editingItem.startTime || '',
                    arrivalTime: editingItem.endTime || '',
                    notes: editingItem.notes || '',
                });
                setFromHint(editingItem.details?.from ? `${editingItem.details.from} (${editingItem.details.fromIata})` : '');
                setToHint(editingItem.details?.to ? `${editingItem.details.to} (${editingItem.details.toIata})` : '');
            } else if (editingItem.type === 'hotel') {
                setFormData({
                    hotelName: editingItem.details?.hotelName || '',
                    address: editingItem.details?.address || '',
                    addressLocation: { latitude: editingItem.location?.lat, longitude: editingItem.location?.lon },
                    checkInDate: editingItem.details?.checkInDate || editingItem.date || '',
                    checkIn: editingItem.details?.checkIn || '',
                    checkOutDate: editingItem.details?.checkOutDate || '',
                    checkOut: editingItem.details?.checkOut || '',
                    notes: editingItem.notes || '',
                });
                setAddressHint(editingItem.details?.address || '');
            } else if (editingItem.type === 'transport') {
                setFormData({
                    transportMode: editingItem.details?.mode || '',
                    transportFrom: editingItem.details?.from || '',
                    transportTo: editingItem.details?.to || '',
                    date: editingItem.date || '',
                    startTime: editingItem.startTime || '',
                    endTime: editingItem.endTime || '',
                    notes: editingItem.notes || '',
                });
            } else if (editingItem.type === 'activity') {
                setFormData({
                    activityName: editingItem.details?.place || editingItem.title || '',
                    activityCategory: editingItem.details?.category || '',
                    activityLocation: editingItem.details?.location || '',
                    locationCoords: { latitude: editingItem.location?.lat, longitude: editingItem.location?.lon },
                    date: editingItem.date || '',
                    startTime: editingItem.startTime || '',
                    endTime: editingItem.endTime || '',
                    notes: editingItem.notes || '',
                });
                setAddressHint(editingItem.details?.location || '');
            } else if (editingItem.type === 'restaurant') {
                setFormData({
                    restaurantName: editingItem.details?.restaurantName || '',
                    cuisine: editingItem.details?.cuisine || '',
                    restaurantLocation: editingItem.details?.location || '',
                    locationCoords: { latitude: editingItem.location?.lat, longitude: editingItem.location?.lon },
                    date: editingItem.date || '',
                    startTime: editingItem.startTime || '',
                    endTime: editingItem.endTime || '',
                    notes: editingItem.notes || '',
                });
                setAddressHint(editingItem.details?.location || '');
            } else if (editingItem.type === 'other') {
                setFormData({
                    otherTitle: editingItem.title || '',
                    otherDescription: editingItem.details?.description || '',
                    otherLocation: editingItem.details?.location || '',
                    locationCoords: { latitude: editingItem.location?.lat, longitude: editingItem.location?.lon },
                    date: editingItem.date || '',
                    startTime: editingItem.startTime || '',
                    endTime: editingItem.endTime || '',
                    notes: editingItem.notes || '',
                });
                setAddressHint(editingItem.details?.location || '');
            }
        }
    }, [editingItem, isOpen]);

    useEffect(() => {
        if (addressHint.length === 0) {
            setAddressResults([]);
            setShowAddressResults(false);
            return;
        }
        
        const timer = setTimeout(async () => {
            const results = await searchAddresses(addressHint);
            setAddressResults(results);
            setShowAddressResults(results.length > 0);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [addressHint]);

    const getAirportResults = (hint, setResults, setShowResults) => {
        if (!hint || hint.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }
        
        const searchTerm = hint.toLowerCase();
        const filtered = airportsData.filter((airport) => 
            airport.name.toLowerCase().includes(searchTerm) ||
            airport.city.toLowerCase().includes(searchTerm) ||
            airport.iata.toLowerCase().includes(searchTerm) ||
            airport.country.toLowerCase().includes(searchTerm)
        ).slice(0, 10); 
        
        setResults(filtered);
        setShowResults(filtered.length > 0);
    };

    useEffect(() => {
        if (fromHint.length === 0) {
            setFromResults([]);
            setShowFromResults(false);
            return;
        }
        const timer = setTimeout(() => getAirportResults(fromHint, setFromResults, setShowFromResults), 500);
        return () => clearTimeout(timer);
    }, [fromHint]);

    useEffect(() => {
        if (toHint.length === 0) {
            setToResults([]);
            setShowToResults(false);
            return;
        }
        const timer = setTimeout(() => getAirportResults(toHint, setToResults, setShowToResults), 500);
        return () => clearTimeout(timer);
    }, [toHint]);

    const handleAddItem = async () => {
        let itemData = null;
        setSaving(true);
        setError(null);

        if (selectedType === 'flight') {
            if (!formData.from || !formData.to) return;

            itemData = {
                type: 'flight',
                date: formData.date || tripStartDate,
                startTime: formData.departureTime || '',
                endTime: formData.arrivalTime || '',
                title: `Flight ${formData.from?.iata || formData.from?.city} → ${formData.to?.iata || formData.to?.city}`,
                details: {
                    from: formData.from?.city || '',
                    fromIata: formData.from?.iata || '',
                    to: formData.to?.city || '',
                    toIata: formData.to?.iata || '',
                    airline: formData.airline || '',
                    pnr: formData.pnr || '',
                },
                location: {
                    lat: formData.from?.lat || 0,
                    lon: formData.from?.lon || 0,
                },
                notes: formData.notes || '',
            };
        } else if (selectedType === 'hotel') {
            if (!formData.hotelName) return;

            itemData = {
                type: 'hotel',
                date: formData.checkInDate || tripStartDate,
                startTime: formData.checkIn || '',
                endTime: null,
                title: 'Hotel Check-in',
                details: {
                    hotelName: formData.hotelName || '',
                    address: formData.address || '',
                    checkInDate: formData.checkInDate || '',
                    checkIn: formData.checkIn || '',
                    checkOutDate: formData.checkOutDate || '',
                    checkOut: formData.checkOut || '',
                },
                location: {
                    lat: formData.addressLocation?.latitude || 0,
                    lon: formData.addressLocation?.longitude || 0,
                },
                notes: formData.notes || '',
            };
        } else if (selectedType === 'transport') {
            if (!formData.transportFrom || !formData.transportTo) return;

            itemData = {
                type: 'transport',
                date: formData.date || tripStartDate,
                startTime: formData.startTime || '',
                endTime: formData.endTime || '',
                title: `${formData.transportMode || 'Transport'} to ${formData.transportTo}`,
                details: {
                    mode: formData.transportMode || '',
                    from: formData.transportFrom || '',
                    to: formData.transportTo || '',
                },
                location: {
                    lat: 0,
                    lon: 0,
                },
                notes: formData.notes || '',
            };
        } else if (selectedType === 'activity') {
            if (!formData.activityName) return;

            itemData = {
                type: 'activity',
                date: formData.date || tripStartDate,
                startTime: formData.startTime || '',
                endTime: formData.endTime || '',
                title: formData.activityName,
                details: {
                    place: formData.activityName || '',
                    category: formData.activityCategory || '',
                    location: formData.activityLocation || '',
                },
                location: {
                    lat: formData.locationCoords?.latitude || 0,
                    lon: formData.locationCoords?.longitude || 0,
                },
                notes: formData.notes || '',
            };
        } else if (selectedType === 'restaurant') {
            if (!formData.restaurantName) return;

            itemData = {
                type: 'restaurant',
                date: formData.date || tripStartDate,
                startTime: formData.startTime || '',
                endTime: formData.endTime || '',
                title: `Meal at ${formData.restaurantName}`,
                details: {
                    restaurantName: formData.restaurantName || '',
                    cuisine: formData.cuisine || '',
                    location: formData.restaurantLocation || '',
                },
                location: {
                    lat: formData.locationCoords?.latitude || 0,
                    lon: formData.locationCoords?.longitude || 0,
                },
                notes: formData.notes || '',
            };
        } else if (selectedType === 'other') {
            if (!formData.otherTitle) return;

            itemData = {
                type: 'other',
                date: formData.date || tripStartDate,
                startTime: formData.startTime || '',
                endTime: formData.endTime || '',
                title: formData.otherTitle,
                details: {
                    description: formData.otherDescription || '',
                    location: formData.otherLocation || '',
                },
                location: {
                    lat: formData.locationCoords?.latitude || 0,
                    lon: formData.locationCoords?.longitude || 0,
                },
                notes: formData.notes || '',
            };
        }

        if (!itemData) {
            setSaving(false);
            return;
        }

        try {
            if (editingItem) {
                await updateItineraryItem(editingItem.id, itemData);
            } else {
                await addItineraryItem(tripId, itemData);
            }
            
            resetForm();
            onClose(true);
        } catch (err) {
            console.error('Error saving item:', err);
            setError('Failed to save item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({});
        setFromHint('');
        setToHint('');
        setFromResults([]);
        setToResults([]);
        setShowFromResults(false);
        setShowToResults(false);
        setAddressHint('');
        setAddressResults([]);
        setShowAddressResults(false);
        setSelectedType('flight');
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose(false);
    };

    const renderFlightForm = () => (
        <div className="mt-4">
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">From</div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search airport/city"
                            className="w-full py-1 px-2 border border-gray-300 rounded-md"
                            value={fromHint}
                            onChange={(e) => setFromHint(e.target.value)}
                        />
                        {showFromResults && fromResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                {fromResults.map((airport) => (
                                    <div
                                        key={airport.id}
                                        className="text-sm font-medium p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        role="button"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, from: airport }));
                                            setFromHint(`${airport.city} (${airport.iata})`);
                                            setShowFromResults(false);
                                        }}
                                    >
                                        <span className="font-bold">{airport.iata}</span> - {airport.name}, {airport.city}, {airport.country}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">To</div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search airport/city"
                            className="w-full py-1 px-2 border border-gray-300 rounded-md"
                            value={toHint}
                            onChange={(e) => setToHint(e.target.value)}
                        />
                        {showToResults && toResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                {toResults.map((airport) => (
                                    <div
                                        key={airport.id}
                                        className="text-sm font-medium p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        role="button"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, to: airport }));
                                            setToHint(`${airport.city} (${airport.iata})`);
                                            setShowToResults(false);
                                        }}
                                    >
                                        <span className="font-bold">{airport.iata}</span> - {airport.name}, {airport.city}, {airport.country}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Airline</div>
                    <input
                        type="text"
                        placeholder="e.g. IndiGo"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.airline || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, airline: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">PNR</div>
                    <input
                        type="text"
                        placeholder="e.g. XYZ123"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.pnr || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, pnr: e.target.value }))}
                    />
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Date</div>
                    <input
                        type="date"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.date || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Departure Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.departureTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, departureTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`dep-${time}`} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Arrival Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.arrivalTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, arrivalTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`arr-${time}`} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Notes</div>
                <textarea
                    placeholder="Add any notes..."
                    className="w-full py-1 px-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
            </div>
        </div>
    );

    const renderHotelForm = () => (
        <div className="mt-4">
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Hotel Name</div>
                <input
                    type="text"
                    placeholder="e.g. Taj Fort Aguada Resort"
                    className="w-full py-1 px-2 border border-gray-300 rounded-md"
                    value={formData.hotelName || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hotelName: e.target.value }))}
                />
            </div>

            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Address</div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for a location"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={addressHint}
                        onChange={(e) => setAddressHint(e.target.value)}
                    />
                    {showAddressResults && addressResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                            {addressResults.map((location) => (
                                <div
                                    key={location.place_id}
                                    className="text-sm p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    role="button"
                                    onClick={() => {
                                        setFormData((prev) => ({ 
                                            ...prev, 
                                            address: location.display_name,
                                            addressLocation: {
                                                latitude: parseFloat(location.lat),
                                                longitude: parseFloat(location.lon),
                                            }
                                        }));
                                        setAddressHint(location.display_name);
                                        setShowAddressResults(false);
                                    }}
                                >
                                    {location.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Check-in Date</div>
                    <input
                        type="date"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.checkInDate || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, checkInDate: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Check-in Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.checkIn || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, checkIn: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`checkin-${time}`} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Check-out Date</div>
                    <input
                        type="date"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.checkOutDate || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, checkOutDate: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Check-out Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.checkOut || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, checkOut: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`checkout-${time}`} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Notes</div>
                <textarea
                    placeholder="Add any notes..."
                    className="w-full py-1 px-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
            </div>
        </div>
    );

    const renderTransportForm = () => (
        <div className="mt-4">
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Mode of Transport</div>
                <select
                    className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                    value={formData.transportMode || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, transportMode: e.target.value }))}
                >
                    <option value="">Select mode</option>
                    <option value="Taxi">Taxi</option>
                    <option value="Bus">Bus</option>
                    <option value="Train">Train</option>
                    <option value="Metro">Metro</option>
                    <option value="Auto">Auto</option>
                    <option value="Car Rental">Car Rental</option>
                    <option value="Bike">Bike</option>
                    <option value="Walk">Walk</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">From</div>
                    <input
                        type="text"
                        placeholder="e.g. Hotel"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.transportFrom || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, transportFrom: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">To</div>
                    <input
                        type="text"
                        placeholder="e.g. Fort Aguada"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.transportTo || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, transportTo: e.target.value }))}
                    />
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Date</div>
                    <input
                        type="date"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.date || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Start Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.startTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`transport-start-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">End Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.endTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`transport-end-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Notes</div>
                <textarea
                    placeholder="Add any notes..."
                    className="w-full py-1 px-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
            </div>
        </div>
    );

    const renderActivityForm = () => (
        <div className="mt-4">
            {/* Activity/Place Name */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Place/Activity Name</div>
                <input
                    type="text"
                    placeholder="e.g. Candolim Beach Visit"
                    className="w-full py-1 px-2 border border-gray-300 rounded-md"
                    value={formData.activityName || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, activityName: e.target.value }))}
                />
            </div>

            {/* Category */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Category</div>
                <select
                    className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                    value={formData.activityCategory || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, activityCategory: e.target.value }))}
                >
                    <option value="">Select category</option>
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Beach">Beach</option>
                    <option value="Museum">Museum</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Nightlife">Nightlife</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Tour">Tour</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Location Search */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Location</div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for location"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={addressHint}
                        onChange={(e) => setAddressHint(e.target.value)}
                    />
                    {showAddressResults && addressResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                            {addressResults.map((location) => (
                                <div
                                    key={location.place_id}
                                    className="text-sm p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    role="button"
                                    onClick={() => {
                                        setFormData((prev) => ({ 
                                            ...prev, 
                                            activityLocation: location.display_name,
                                            locationCoords: {
                                                latitude: parseFloat(location.lat),
                                                longitude: parseFloat(location.lon),
                                            }
                                        }));
                                        setAddressHint(location.display_name);
                                        setShowAddressResults(false);
                                    }}
                                >
                                    {location.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Date, Start and End Time */}
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Date</div>
                    <input
                        type="date"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.date || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Start Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.startTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`activity-start-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">End Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.endTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`activity-end-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Notes</div>
                <textarea
                    placeholder="Add any notes..."
                    className="w-full py-1 px-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
            </div>
        </div>
    );

    const renderRestaurantForm = () => (
        <div className="mt-4">
            {/* Restaurant Name */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Restaurant Name</div>
                <input
                    type="text"
                    placeholder="e.g. Fisherman's Wharf"
                    className="w-full py-1 px-2 border border-gray-300 rounded-md"
                    value={formData.restaurantName || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, restaurantName: e.target.value }))}
                />
            </div>

            {/* Cuisine */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Cuisine</div>
                <input
                    type="text"
                    placeholder="e.g. Goan, Seafood"
                    className="w-full py-1 px-2 border border-gray-300 rounded-md"
                    value={formData.cuisine || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cuisine: e.target.value }))}
                />
            </div>

            {/* Location Search */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Location</div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for restaurant location"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={addressHint}
                        onChange={(e) => setAddressHint(e.target.value)}
                    />
                    {showAddressResults && addressResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                            {addressResults.map((location) => (
                                <div
                                    key={location.place_id}
                                    className="text-sm p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    role="button"
                                    onClick={() => {
                                        setFormData((prev) => ({ 
                                            ...prev, 
                                            restaurantLocation: location.display_name,
                                            locationCoords: {
                                                latitude: parseFloat(location.lat),
                                                longitude: parseFloat(location.lon),
                                            }
                                        }));
                                        setAddressHint(location.display_name);
                                        setShowAddressResults(false);
                                    }}
                                >
                                    {location.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Date, Start and End Time */}
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Date</div>
                    <input
                        type="date"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.date || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Start Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.startTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`restaurant-start-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">End Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.endTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`restaurant-end-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Notes</div>
                <textarea
                    placeholder="Add any notes..."
                    className="w-full py-1 px-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
            </div>
        </div>
    );

    const renderOtherForm = () => (
        <div className="mt-4">
            {/* Title */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Title</div>
                <input
                    type="text"
                    placeholder="e.g. Souvenir Shopping"
                    className="w-full py-1 px-2 border border-gray-300 rounded-md"
                    value={formData.otherTitle || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, otherTitle: e.target.value }))}
                />
            </div>

            {/* Description */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Description</div>
                <input
                    type="text"
                    placeholder="e.g. Buy local handicrafts and souvenirs"
                    className="w-full py-1 px-2 border border-gray-300 rounded-md"
                    value={formData.otherDescription || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, otherDescription: e.target.value }))}
                />
            </div>

            {/* Location Search */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Location (Optional)</div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for location"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={addressHint}
                        onChange={(e) => setAddressHint(e.target.value)}
                    />
                    {showAddressResults && addressResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                            {addressResults.map((location) => (
                                <div
                                    key={location.place_id}
                                    className="text-sm p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    role="button"
                                    onClick={() => {
                                        setFormData((prev) => ({ 
                                            ...prev, 
                                            otherLocation: location.display_name,
                                            locationCoords: {
                                                latitude: parseFloat(location.lat),
                                                longitude: parseFloat(location.lon),
                                            }
                                        }));
                                        setAddressHint(location.display_name);
                                        setShowAddressResults(false);
                                    }}
                                >
                                    {location.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Date, Start and End Time */}
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Date</div>
                    <input
                        type="date"
                        className="w-full py-1 px-2 border border-gray-300 rounded-md"
                        value={formData.date || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Start Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.startTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`other-start-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium mb-1">End Time</div>
                    <select
                        className="w-full py-1 px-2 border border-gray-300 rounded-md bg-white"
                        value={formData.endTime || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    >
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((time) => (
                            <option key={`other-end-${time}`} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
                <div className="text-sm font-medium mb-1">Notes</div>
                <textarea
                    placeholder="Add any notes..."
                    className="w-full py-1 px-2 border border-gray-300 rounded-md resize-none"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
            </div>
        </div>
    );

    const renderFormByType = () => {
        switch (selectedType) {
            case 'flight':
                return renderFlightForm();
            case 'hotel':
                return renderHotelForm();
            case 'transport':
                return renderTransportForm();
            case 'activity':
                return renderActivityForm();
            case 'restaurant':
                return renderRestaurantForm();
            case 'other':
                return renderOtherForm();
            default:
                return null;
        }
    };

    const footerContent = (
        <div className="flex flex-row justify-end gap-2">
            <button
                className="bg-transparent text-sm text-gray-900 py-1 px-2 rounded-md"
                onClick={handleClose}
                disabled={saving}
            >
                Cancel
            </button>
            <button
                className="bg-cyan-500 text-sm text-white py-1 px-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                onClick={handleAddItem}
                disabled={saving}
            >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editingItem ? 'Edit Item' : 'Add New Item'}
            width="2xl"
            showCloseButton={false}
            footer={footerContent}
        >
            {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                </div>
            )}
            
            <div className="flex flex-wrap gap-3">
                {ITEM_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                        <button
                            key={type.id}
                            className={`flex flex-col items-center justify-center gap-1.5 w-20 h-20 rounded-xl text-xs font-medium transition-colors duration-200 ${
                                isSelected
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            onClick={() => setSelectedType(type.id)}
                        >
                            <Icon className="w-6 h-6" />
                            {type.label}
                        </button>
                    );
                })}
            </div>

            {renderFormByType()}
        </Modal>
    );
};

export default AddItemModal;

