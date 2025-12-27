import React, { useState } from 'react';
import Header from '../../components/Header';
import { PlusIcon } from 'lucide-react';
import TripCard from '../../components/TripCard';
import CreateTripModal from '../../components/CreateTripModal';

const Dashboard = () => {
    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const [showCreateTripModal, setShowCreateTripModal] = useState(false);
    return <div className="flex flex-col items-center w-full h-screen bg-gray-bg">
        {showCreateTripModal && <CreateTripModal setShowCreateTripModal={setShowCreateTripModal}/>}
        <Header title="Planora" settingsButton/>
        <div className="flex flex-col w-full h-screen rounded-t-2xl py-8 px-12">
            <div
                role="button"
                className="bg-navy text-white py-2 px-4 rounded-2xl cursor-pointer self-start flex flex-row items-center gap-2"
                onClick={() => setShowCreateTripModal(true)}
            >
                <PlusIcon className="w-4 h-4 text-white" /> <span className="text-white">Create Trip</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mt-8">
                {existingTrips.map((trip, i) => (
                    <TripCard key={i} trip={trip} />
                ))}
            </div>
        </div>
    </div>
};

export default Dashboard;