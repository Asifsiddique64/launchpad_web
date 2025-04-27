import axios from "axios";

const fileUploadApi = axios.create({
  baseURL: "/api",
});

fileUploadApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

fileUploadApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status) {
      throw new Error(error.response.data.message);
    } else {
      console.error("An error occurred:", error);
    }

    return Promise.reject(error);
  }
);

export default fileUploadApi; 