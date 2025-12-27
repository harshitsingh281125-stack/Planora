import { useNavigate } from 'react-router-dom';
import TripImage from '../../assets/images/TripPlaceholder.jpg';
import { formatEndDate, formatStartDate } from '../../utils';

const TripCard = ({trip}) => {
    const navigate = useNavigate();
    return (
        <div className="group bg-white rounded-lg p-2 items-center shadow-md hover:border-2 hover:border-navy hover:bg-light-blue transition-all duration-300 cursor-pointer flex flex-col w-fit">

            <img src={trip.coverPhoto || TripImage} alt="Trip" className="w-40 h-[88px] object-cover rounded-lg" />
            <div className='flex flex-col self-start mt-1 mb-4'>
                <div className='font-bold text-md'>
                    {trip.name}
                </div>
                <div className='text-xs font-medium'>
                    {formatStartDate(trip.startDate)} - {formatEndDate(trip.endDate)}
                </div>
            </div>
            <div className='flex flex-row justify-center w-full py-0.5 border-[1px] border-gray-200 rounded-xl bg-gray-100 group-hover:bg-white shadow-sm text-sm font-medium transition-colors duration-300'
            role="button"
            onClick={() => {
                navigate(`/trip/${trip.id}`);
            }}
            >
                View Trip
            </div>
        </div>
    )
}

export default TripCard;