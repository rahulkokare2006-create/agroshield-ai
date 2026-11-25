"""
AGROSHIELD AI - Community Disease Reporting Network
===================================================
Implements crowdsourced participatory disease monitoring:
1. Calculates Haversine distance to neighboring verified disease reports (0.5 to 5.0 km).
2. Calculates bearing angle and evaluates alignment with local wind vectors.
3. Generates downwind inoculum proximity warnings.
"""

import math
from typing import List, Dict, Any
from ..schemas import CommunityNetworkResponse, CommunityOutbreakItem
from ..database import get_connection

def calculate_haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates spherical distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates initial bearing angle from point 1 to point 2 in degrees (0 - 360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)
    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing = math.degrees(math.atan2(y, x))
    return round((bearing + 360.0) % 360.0, 1)

def get_community_network_analysis(
    field_id: int,
    user_lat: float,
    user_lng: float,
    wind_direction_deg: float = 265.0,  # Westerly
    wind_speed_kmh: float = 12.0
) -> CommunityNetworkResponse:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM community_outbreaks;")
    rows = cursor.fetchall()
    conn.close()

    items: List[CommunityOutbreakItem] = []
    upwind_risk_count = 0

    # Direction wind is blowing TOWARDS (from + 180 mod 360)
    wind_blows_towards = (wind_direction_deg + 180.0) % 360.0

    for r in rows:
        r_lat = r["jittered_lat"]
        r_lng = r["jittered_lng"]
        
        # Distance from reported outbreak to user's field
        dist_km = calculate_haversine_distance_km(r_lat, r_lng, user_lat, user_lng)
        
        if dist_km <= 5.0:
            # Bearing from outbreak to user
            bearing = calculate_bearing_deg(r_lat, r_lng, user_lat, user_lng)
            
            # Check angular deviation between wind blowing direction and user bearing
            angular_diff = abs(bearing - wind_blows_towards)
            angular_diff = min(angular_diff, 360.0 - angular_diff)
            
            # If user field is within 45 degrees downwind cone of outbreak
            is_wind_aligned = bool(angular_diff <= 45.0 and wind_speed_kmh >= 6.0)
            
            if is_wind_aligned:
                upwind_risk_count += 1
                
            items.append(CommunityOutbreakItem(
                id=r["id"],
                distance_km=dist_km,
                bearing_deg=bearing,
                wind_aligned=is_wind_aligned,
                disease_name=r["disease_name"],
                severity=r["severity"],
                verification_status=r["verification_status"],
                created_at=str(r["created_at"]),
                notes=r["notes"]
            ))

    if upwind_risk_count > 0:
        proximity_level = "ELEVATED_INOCULUM_WARNING"
        advisory = (
            f"Precautionary Downwind Alert: {upwind_risk_count} verified Early Blight report(s) "
            f"detected within 5 km in the upwind corridor ({wind_speed_kmh:.0f} km/h Westerly wind). "
            f"Airborne conidia may travel to your western boundary rows. "
            f"Apply protective biological barrier (Trichoderma) to perimeter rows."
        )
    elif len(items) > 0:
        proximity_level = "MODERATE"
        advisory = (
            f"Nearby Disease Pressure: {len(items)} confirmed report(s) within 5 km, but wind direction is not currently "
            f"transporting airborne conidia directly toward your field. Maintain regular scouting."
        )
    else:
        proximity_level = "LOW"
        advisory = "Zero confirmed disease sightings within a 5 km radius. Local community inoculum pressure is low."

    return CommunityNetworkResponse(
        field_id=field_id,
        user_coords=[user_lat, user_lng],
        local_wind_direction_deg=wind_direction_deg,
        local_wind_speed_kmh=wind_speed_kmh,
        total_active_reports_within_5km=len(items),
        upwind_high_risk_reports=upwind_risk_count,
        proximity_risk_level=proximity_level,
        advisory=advisory,
        reports=items
    )
