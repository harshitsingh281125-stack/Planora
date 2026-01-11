import { supabase } from '../lib/supabase';

export const getTrips = async () => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('start_date', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const getTrip = async (tripId) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getTripWithItinerary = async (tripId) => {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();
  
  if (tripError) throw tripError;

  const { data: itinerary, error: itineraryError } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  
  if (itineraryError) throw itineraryError;

  const transformedItinerary = (itinerary || []).map(item => ({
    id: item.id,
    type: item.type,
    date: item.date,
    startTime: item.start_time,
    endTime: item.end_time,
    title: item.title,
    details: item.details,
    location: item.location,
    notes: item.notes,
  }));

  return { 
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.start_date,
    endDate: trip.end_date,
    coverPhoto: trip.cover_photo,
    itinerary: transformedItinerary 
  };
};

export const createTrip = async (tripData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      name: tripData.name,
      destination: tripData.destination,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      cover_photo: tripData.coverPhoto || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    destination: data.destination,
    startDate: data.start_date,
    endDate: data.end_date,
    coverPhoto: data.cover_photo,
    itinerary: [],
  };
};

export const updateTrip = async (tripId, updates) => {
  const { data, error } = await supabase
    .from('trips')
    .update({
      name: updates.name,
      destination: updates.destination,
      start_date: updates.startDate,
      end_date: updates.endDate,
      cover_photo: updates.coverPhoto,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteTrip = async (tripId) => {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);
  
  if (error) throw error;
};

export const addItineraryItem = async (tripId, item) => {
  const { data, error } = await supabase
    .from('itinerary_items')
    .insert({
      trip_id: tripId,
      type: item.type,
      date: item.date,
      start_time: item.startTime || null,
      end_time: item.endTime || null,
      title: item.title,
      details: item.details || {},
      location: item.location || { lat: 0, lon: 0 },
      notes: item.notes || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    type: data.type,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    title: data.title,
    details: data.details,
    location: data.location,
    notes: data.notes,
  };
};

export const updateItineraryItem = async (itemId, updates) => {
  const { data, error } = await supabase
    .from('itinerary_items')
    .update({
      type: updates.type,
      date: updates.date,
      start_time: updates.startTime || null,
      end_time: updates.endTime || null,
      title: updates.title,
      details: updates.details || {},
      location: updates.location || { lat: 0, lon: 0 },
      notes: updates.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    type: data.type,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    title: data.title,
    details: data.details,
    location: data.location,
    notes: data.notes,
  };
};

export const deleteItineraryItem = async (itemId) => {
  const { error } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
};

export const addMultipleItineraryItems = async (tripId, items) => {
  const itemsToInsert = items.map(item => ({
    trip_id: tripId,
    type: item.type,
    date: item.date,
    start_time: item.startTime || null,
    end_time: item.endTime || null,
    title: item.title,
    details: item.details || {},
    location: item.location || { lat: 0, lon: 0 },
    notes: item.notes || null,
  }));

  const { data, error } = await supabase
    .from('itinerary_items')
    .insert(itemsToInsert)
    .select();
  
  if (error) throw error;
  
  return data.map(item => ({
    id: item.id,
    type: item.type,
    date: item.date,
    startTime: item.start_time,
    endTime: item.end_time,
    title: item.title,
    details: item.details,
    location: item.location,
    notes: item.notes,
  }));
};

export const generateShareToken = async (tripId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, share_token')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single();

  if (tripError) throw tripError;
  if (!trip) throw new Error('Trip not found');

  if (trip.share_token) {
    return trip.share_token;
  }

  const shareToken = crypto.randomUUID();

  const { error: updateError } = await supabase
    .from('trips')
    .update({ share_token: shareToken })
    .eq('id', tripId);

  if (updateError) throw updateError;

  return shareToken;
};


export const getTripByShareToken = async (shareToken) => {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('share_token', shareToken)
    .single();

  if (tripError) throw tripError;
  if (!trip) throw new Error('Trip not found');

  const { data: itinerary, error: itineraryError } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', trip.id)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (itineraryError) throw itineraryError;

  const transformedItinerary = (itinerary || []).map(item => ({
    id: item.id,
    type: item.type,
    date: item.date,
    startTime: item.start_time,
    endTime: item.end_time,
    title: item.title,
    details: item.details,
    location: item.location,
    notes: item.notes,
  }));

  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.start_date,
    endDate: trip.end_date,
    coverPhoto: trip.cover_photo,
    itinerary: transformedItinerary,
  };
};

export const revokeShareToken = async (tripId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { error } = await supabase
    .from('trips')
    .update({ share_token: null })
    .eq('id', tripId)
    .eq('user_id', user.id);

  if (error) throw error;
};

