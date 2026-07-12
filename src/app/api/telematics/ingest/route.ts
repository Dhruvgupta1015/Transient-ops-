import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (using service role key for ingestion if available, or anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Basic Validation
    let vehicleId = data.vehicle_id || data.vehicleId;
    const driverId = data.driver_id || data.driverId || null;
    let source = data.source;
    
    // Auto-detect source if not provided
    if (!source) {
      source = driverId ? 'mobile_app' : 'telematics';
    }

    if (!supabaseUrl || !supabaseKey) {
      // Return success if no DB is configured (mock environment)
      return NextResponse.json({ 
        message: 'Telemetry received (simulated - no DB keys configured).',
        received: data 
      }, { status: 200 });
    }

    // Lookup vehicle UUID if registration number is provided
    if (vehicleId && !vehicleId.includes('-')) {
       const { data: vData } = await supabase.from('vehicles').select('id').eq('registration_number', vehicleId).single();
       if (vData) {
           vehicleId = vData.id;
       } else {
           return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
       }
    }

    // If mobile app and no vehicleId provided, we can look it up by driverId
    if (!vehicleId && driverId) {
       const { data: driverData } = await supabase.from('drivers').select('assigned_vehicle_id').eq('id', driverId).single();
       if (driverData && driverData.assigned_vehicle_id) {
           vehicleId = driverData.assigned_vehicle_id;
       }
    }

    if (!vehicleId || data.latitude === undefined || data.longitude === undefined) {
      return NextResponse.json({ error: 'Missing required location fields.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('vehicle_location_events')
      .insert({
        vehicle_id: vehicleId,
        driver_id: driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed || 0,
        heading: data.heading || 0,
        ignition_status: data.ignition !== undefined ? data.ignition : (data.ignition_status ?? true),
        source: source,
        fuel_level: data.fuelLevel || data.fuel_level || null,
        battery_level: data.battery || data.battery_level || null,
        gps_accuracy: data.accuracy || data.gps_accuracy || null,
        recorded_at: data.timestamp || new Date().toISOString(),
      });

    if (error) {
      console.error('Telematics Insert Error:', error);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Telemetry logged successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Telematics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
