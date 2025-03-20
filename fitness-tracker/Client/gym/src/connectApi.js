//src\connectApi.js

import axios from 'axios'
const API = axios.create({
    baseURL: "http://localhost:5050/api",
    withCredentials: true,  
});

export default API