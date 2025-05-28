import axios, { AxiosRequestConfig } from 'axios';
import { userInfo } from '../types';

// Ensure there is a protocol included
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
export const ADMIN_WALLET = import.meta.env.VITE_ADMIN_WALLET || "";

const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
};

const config: AxiosRequestConfig = {
    headers,
};

export const test = async () => {
    const res = await fetch(BACKEND_URL);
    const data = await res.json();
}

export const getUser = async ({ id }: { id: string }): Promise<any> => {
    try {
        const response = await axios.get(`${BACKEND_URL}/user/${id}`, config);
        return response.data;
    } catch (err) {
        console.error("Error in getUser:", err);
        return { error: "Error setting up the request" };
    }
}

export const updateUser = async (id: string, data: userInfo): Promise<any> => {
    try {
        const response = await axios.post(`${BACKEND_URL}/user/update/${id}`, data, config);
        return response.data;
    } catch (err) {
        console.error("Error in updateUser:", err);
        return { error: "Error setting up the request" };
    }
}

export const walletConnect = async ({ data }: { data: userInfo }): Promise<any> => {
    try {
        console.log("--------walletConnect --------",);
        const response = await axios.post(`${BACKEND_URL}/user`, data);
        return response.data;
    } catch (err) {
        console.error("Error in walletConnect:", err);
        return { error: "Error setting up the request" };
    }
}

export const confirmWallet = async ({ data }: { data: userInfo }): Promise<any> => {
    try {
        const response = await axios.post(`${BACKEND_URL}/user/confirm`, data, config);
        return response.data;
    } catch (err) {
        console.error("Error in confirmWallet:", err);
        return { error: "Error setting up the request" };
    }
}

// =========================== Functions =====================================

const JWT = import.meta.env.PRIVATE_KEY;

export const pinFileToIPFS = async (blob: File) => {
    try {
        const data = new FormData();
        data.append("file", blob);
        const res = await fetch(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${JWT}`,
                },
                body: data,
            }
        );
        const resData = await res.json();
        return resData;
    } catch (error) {
        console.error("Error in pinFileToIPFS:", error);
    }
};

export const uploadImage = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const imageFile = new File([blob], "image.png", { type: "image/png" });
    const resData = await pinFileToIPFS(imageFile);

    if (resData) {
        return `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`;
    } else {
        return false;
    }
};

export const getSolPriceInUSD = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const solPriceInUSD = response.data.solana.usd;
        return solPriceInUSD;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        throw error;
    }
};
