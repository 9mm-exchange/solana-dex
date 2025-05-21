"use client"
import { createContext } from 'react';
import { userInfo } from '../types';

const UserContext = createContext({
    isLoading: false,
    setIsLoading: (value: boolean) => { },
    solPrice: 0,
    setSolPrice: (value: number) => { },
    slippage: 1,
    setSlippage: (value: number) => { },
    speed: "fast",
    setSpeed: (value: string) => { },
    slippageModal: false,
    setSlippageModal: (value: boolean) => { },
    user: {} as userInfo,
    setUser: (value: userInfo) => { },
    login: false,
    setLogin: (value: boolean) => { },
})

export default UserContext;