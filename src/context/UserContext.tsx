"use client"
import React, { createContext, ReactNode, useState } from 'react';
import { userInfo } from '../types';

interface UserContextType {
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
    solPrice: number;
    setSolPrice: (value: number) => void;
    slippage: number;
    setSlippage: (value: number) => void;
    speed: string;
    setSpeed: (value: string) => void;
    slippageModal: boolean;
    setSlippageModal: (value: boolean) => void;
    user: userInfo;
    setUser: (value: userInfo) => void;
    login: boolean;
    setLogin: (value: boolean) => void;
}

const UserContext = createContext<UserContextType>({
    isLoading: false,
    setIsLoading: () => {},
    solPrice: 0,
    setSolPrice: () => {},
    slippage: 1,
    setSlippage: () => {},
    speed: "fast",
    setSpeed: () => {},
    slippageModal: false,
    setSlippageModal: () => {},
    user: {} as userInfo,
    setUser: () => {},
    login: false,
    setLogin: () => {},
});

interface UserContextProviderProps {
    children: ReactNode;
}

export const UserContextProvider = ({ children }: UserContextProviderProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [solPrice, setSolPrice] = useState(0);
    const [slippage, setSlippage] = useState(1);
    const [speed, setSpeed] = useState("fast");
    const [slippageModal, setSlippageModal] = useState(false);
    const [user, setUser] = useState<userInfo>({} as userInfo);
    const [login, setLogin] = useState(false);

    const value: UserContextType = {
        isLoading,
        setIsLoading,
        solPrice,
        setSolPrice,
        slippage,
        setSlippage,
        speed,
        setSpeed,
        slippageModal,
        setSlippageModal,
        user,
        setUser,
        login,
        setLogin,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext; 