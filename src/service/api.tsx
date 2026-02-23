import axios from 'axios';
import { BASE_URL } from '@/config/constants';
import { getUserId, getUserPhone, supabase } from '@/config/supabase';


export const api = axios.create({
  baseURL: BASE_URL, 
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  }, 
});


api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});


export const fetchPrices = async ({
  type,
  workSize,
}: {
  type: string;
  workSize: string;
}) => {
  try {
    const res = await api.post("/jobs/get-prices", {
      type,
      workSize,
    });

    return res.data;
  } catch (err: any) {
    console.log("PRICE ERROR:", err?.response?.data || err.message);
    throw err;
  }
};

export const bookJob = async (payload: {
  type: string;
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  phone: any;
  workerTier: string;
  workSize: string;
  visitFee: number;
  jobCharge: number;
  estimatedTotal: number;
  minPrice: number;
  maxPrice: number;
}) => {
  try {
    const res = await api.post("/jobs", payload);
    return res.data;
  } catch (err: any) {
    console.log("BOOK JOB ERROR:", err?.response?.data || err.message);
    throw err;
  }
};

export const getJob = async () => {
  const id = await getUserId();

  try {
    const res = await api.get(`/jobs/my/${id}`);
    const jobs = res.data.jobs ?? [];
    const filterJobs = jobs.filter((job: any) => job.status !== "COMPLETED");
    return filterJobs[0];
  } catch (err: any) {
    console.log("GET JOB ERROR:", err?.response?.data || err.message);
    throw err;
  }
};

export const getJobDetails = async () => {
  const id = await getUserId();

  try {
    const res = await api.get(`/jobs/my/${id}`);
    return res.data;
  } catch (err: any) {
    console.log("GET JOB DETAILS ERROR:", err?.response?.data || err.message);
    throw err;
  }
};

export const cancelJob = async (
  jobId: string,
  reason: string = "CANCELLED_BY_USER",
) => {
  try {
    const res = await api.patch(`/jobs/${jobId}/cancel`, { reason });
    return res.data;
  } catch (err: any) {
    console.log("CANCEL JOB ERROR:", err?.response?.data || err.message);
    throw err;
  }
};

export const verifyPrice = async (jobId: string) => {
  try {
    await api.patch(`/jobs/${jobId}/approve`);
    return true;
  } catch (err) {
    console.log("Verify price failed", err);
    return false;
  }
};


