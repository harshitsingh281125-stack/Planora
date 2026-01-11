import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import { PlusIcon, Loader2 } from 'lucide-react';
import TripCard from '../../components/TripCard';
import CreateTripModal from '../../components/CreateTripModal';
import { getTrips } from '../../services/tripsService';

const Dashboard = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateTripModal, setShowCreateTripModal] = useState(false);

    const loadTrips = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTrips();
            const transformedTrips = data.map(trip => ({
                id: trip.id,
                name: trip.name,
                destination: trip.destination,
                startDate: trip.start_date,
                endDate: trip.end_date,
                coverPhoto: trip.cover_photo,
            }));
            setTrips(transformedTrips);
        } catch (err) {
            console.error('Error loading trips:', err);
            setError('Failed to load trips. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const handleModalClose = (created = false) => {
        setShowCreateTripModal(false);
        if (created) {
            loadTrips();
        }
    };

    return (
        <div className="flex flex-col items-center w-full h-screen bg-gray-bg">
            <CreateTripModal 
                isOpen={showCreateTripModal} 
                setShowCreateTripModal={handleModalClose}
            />
            <Header title="Planora" settingsButton/>
            <div className="flex flex-col w-full h-screen rounded-t-2xl py-8 px-12">
                <div
                    role="button"
                    className="bg-navy text-white py-2 px-4 rounded-2xl cursor-pointer self-start flex flex-row items-center gap-2"
                    onClick={() => setShowCreateTripModal(true)}
                >
                    <PlusIcon className="w-4 h-4 text-white" /> <span className="text-white">Create Trip</span>
                </div>

                {loading && (
                    <div className="flex items-center justify-center mt-16">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                        <button 
                            onClick={loadTrips}
                            className="ml-2 underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && trips.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-16 text-gray-500">
                        <p className="text-lg">No trips yet</p>
                        <p className="text-sm mt-1">Create your first trip to get started!</p>
                    </div>
                )}

                {!loading && !error && trips.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mt-8">
                        {trips.map((trip) => (
                            <TripCard key={trip.id} trip={trip} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
