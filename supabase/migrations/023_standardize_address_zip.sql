UPDATE blood_collector SET address = address - 'postal_code' || jsonb_build_object('zip', address->>'postal_code') WHERE address ? 'postal_code' AND NOT address ? 'zip';
