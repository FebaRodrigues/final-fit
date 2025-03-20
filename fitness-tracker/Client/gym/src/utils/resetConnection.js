import { resetPortDetection } from './serverPortDetector';

/**
 * Utility function to reset the client's connection to the server
 * This can be called when connection issues are detected
 */
export const resetConnection = () => {
    // Clear any cached server port
    localStorage.removeItem('serverPort');
    
    // Reset the port detection
    resetPortDetection();
    
    // Log the action
    console.log('Connection reset. Will attempt to reconnect on next API call.');
    
    return true;
};

/**
 * Utility function to manually set the server port
 * This can be used when automatic detection fails
 * @param {number} port - The port number to use
 */
export const setServerPort = (port) => {
    if (!port || isNaN(parseInt(port))) {
        console.error('Invalid port number');
        return false;
    }
    
    const portNumber = parseInt(port);
    localStorage.setItem('serverPort', portNumber.toString());
    console.log(`Server port manually set to ${portNumber}`);
    
    return true;
};

export default resetConnection; 