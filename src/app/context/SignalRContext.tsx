import React, { createContext, useContext, useEffect, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';

const API_BASE = import.meta.env.VITE_API_BASE;

interface SignalRContextType {
  lastProductsUpdate: number;
  lastCategoriesUpdate: number;
}

const SignalRContext = createContext<SignalRContextType>({
  lastProductsUpdate: Date.now(),
  lastCategoriesUpdate: Date.now(),
});

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastProductsUpdate, setLastProductsUpdate] = useState(Date.now());
  const [lastCategoriesUpdate, setLastCategoriesUpdate] = useState(Date.now());

  useEffect(() => {
    let connection: HubConnection | undefined;
    let cancelled = false;

    const connect = async () => {
      const signalR = await import('@microsoft/signalr');
      if (cancelled) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE}/appHub`, {
          withCredentials: false,
        })
        .withAutomaticReconnect()
        .build();

      connection.on('ProductsUpdated', () => {
        setLastProductsUpdate(Date.now());
      });

      connection.on('CategoriesUpdated', () => {
        setLastCategoriesUpdate(Date.now());
      });

      connection.start()
        .then(() => console.log('SignalR Connected'))
        .catch(err => console.error('SignalR Connection Error: ', err));
    };

    void connect();

    return () => {
      cancelled = true;
      void connection?.stop();
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ lastProductsUpdate, lastCategoriesUpdate }}>
      {children}
    </SignalRContext.Provider>
  );
};
