import { useNavigate } from 'react-router-dom';
import TripImage from '../../assets/images/TripPlaceholder.jpg';
import { formatEndDate, formatStartDate } from '../../utils';
import ActionButton from '../ActionButton';

const TripCard = ({trip}) => {
    const navigate = useNavigate();
    return (
        <div className="group bg-white rounded-lg p-2 items-center shadow-md hover:border-2 hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-300 cursor-pointer flex flex-col w-fit">

            <img src={trip.coverPhoto || TripImage} alt="Trip" className="w-40 h-[88px] object-cover rounded-lg" />
            <div className='flex flex-col self-start mt-1 mb-4'>
                <div className='font-bold text-md'>
                    {trip.name}
                </div>
                <div className='text-xs font-medium'>
                    {formatStartDate(trip.startDate)} - {formatEndDate(trip.endDate)}
                </div>
            </div>
           <ActionButton label="View Trip" onClick={() => {
            navigate(`/trip/${trip.id}`);
           }} />
        </div>
    )
}

export default TripCard;