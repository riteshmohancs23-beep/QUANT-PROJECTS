import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

export const healthCheck   = ()                    => api.get("/health");
export const fetchData     = (ticker, start, end)  => api.get("/data", { params: { ticker, start, end } });
export const trainModel    = (ticker, start, end)  => api.post("/train-model", { ticker, start, end });
export const fetchRegimes  = (ticker)              => api.get("/regimes", { params: { ticker } });
export const fetchStrategy = (ticker)              => api.get("/strategy-performance", { params: { ticker } });
