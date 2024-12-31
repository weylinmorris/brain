export async function getDeviceLocation() {
    try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            console.log("Geolocation is not supported by your browser", "warning");
            return null;
        }

        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        };
    } catch (error) {
        // Handle specific geolocation errors
        if (error.code) {
            switch (error.code) {
                case 1: // PERMISSION_DENIED
                    console.log("Please enable location permissions to use this feature", "warning");
                    break;
                case 2: // POSITION_UNAVAILABLE
                    console.log("Location information is unavailable", "warning");
                    break;
                case 3: // TIMEOUT
                    console.log("Location request timed out", "warning");
                    break;
                default:
                    console.log("An error occurred while getting your location", "warning");
            }
        } else {
            console.log("Failed to get device location", "warning");
        }
        return null;
    }
}

export function getDeviceName() {
    try {
        if (!navigator?.userAgent) {
            console.log("Unable to detect device information", "warning");
            return "Unknown Device";
        }
        return navigator.userAgent;
    } catch (error) {
        console.log("Failed to get device information", "warning");
        return "Unknown Device";
    }
}