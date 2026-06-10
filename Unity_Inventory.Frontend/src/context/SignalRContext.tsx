'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7217/api';
const HUB_URL = API_BASE_URL.replace('/api', '') + '/hubs/summary';

export interface SummaryDataUpdate {
  saleReport: {
    id: number;
    businessId: number;
    customerId: number;
    customerName: string;
    reportDate: string;
    totalAmount: number;
    remarks: string | null;
    vouchers: {
      id: number;
      inventoryId: number;
      inventoryName: string;
      quantity: number;
      sellPrice: number;
      subTotal: number;
    }[];
  };
  updatedSummary: {
    summaryId: number;
    businessId: number;
    summaryType: string;
    periodStartDate: string;
    periodEndDate: string;
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
    totalItemsSold: number;
    uniqueCustomers: number;
    topCustomerId?: number;
    topCustomerName?: string;
    topCustomerTotal?: number;
    topProductId?: number;
    topProductName?: string;
    topProductQuantitySold?: number;
    topProductRevenue?: number;
    customerRanks?: {
      rank: number;
      customerId: number;
      customerName: string;
      totalRevenue: number;
      totalOrders: number;
      percentageOfRevenue: number;
    }[];
    productRanks?: {
      rank: number;
      productId: number;
      productName: string;
      quantitySold: number;
      revenue: number;
      percentageOfRevenue: number;
    }[];
    salesTrend?: {
      label: string;
      revenue: number;
      orders: number;
    }[];
    generatedAt: string;
    source: string;
  } | null;
}

interface SignalRContextType {
  isConnected: boolean;
  connectionState: signalR.HubConnectionState;
  lastSummaryUpdate: SummaryDataUpdate | null;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );
  const [lastSummaryUpdate, setLastSummaryUpdate] = useState<SummaryDataUpdate | null>(null);

  const { currentBusinessId } = useAuth();
  const prevBusinessIdRef = useRef<number | null>(null);
  const registeredConnectionIdRef = useRef<string | null>(null);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const getAccessToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') ?? '';
    }
    return '';
  }, []);

  // Manage joining and leaving business groups automatically
  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection || !isConnected) return;

    const manageGroups = async () => {
      try {
        const currentConnId = connection.connectionId;
        const prevBusinessId = prevBusinessIdRef.current;
        const prevConnId = registeredConnectionIdRef.current;

        // If we have an active registration on a connection
        if (prevBusinessId !== null) {
          // If the business ID changed, but connection ID is the same, leave the old group
          if (prevBusinessId !== currentBusinessId && prevConnId === currentConnId) {
            console.log(`Leaving business group business-${prevBusinessId}`);
            await connection.invoke('LeaveBusinessGroup', prevBusinessId);
          }
          // Reset local tracking if we are switching business or connection ID changed
          if (prevBusinessId !== currentBusinessId || prevConnId !== currentConnId) {
            prevBusinessIdRef.current = null;
            registeredConnectionIdRef.current = null;
          }
        }

        // Join the new business group if not already registered for this connection + business combination
        if (currentBusinessId !== null && (prevBusinessIdRef.current !== currentBusinessId || registeredConnectionIdRef.current !== currentConnId)) {
          console.log(`Joining business group business-${currentBusinessId} on connection ${currentConnId}`);
          await connection.invoke('JoinBusinessGroup', currentBusinessId);
          prevBusinessIdRef.current = currentBusinessId;
          registeredConnectionIdRef.current = currentConnId;
        }
      } catch (err) {
        console.error('Error managing business groups in SignalR:', err);
      }
    };

    manageGroups();
  }, [isConnected, currentBusinessId]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: getAccessToken
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => {
      setConnectionState(connection.state);
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      setConnectionState(connection.state);
      setIsConnected(true);
    });

    connection.onclose(() => {
      setConnectionState(connection.state);
      setIsConnected(false);
    });

    // Listen for the composite summary update event
    connection.on('SummaryDataUpdated', (data: SummaryDataUpdate) => {
      setLastSummaryUpdate(data);
    });

    const startConnection = async () => {
      try {
        setConnectionState(connection.state);
        await connection.start();
        setConnectionState(connection.state);
        setIsConnected(true);
      } catch (err) {
        console.error('SignalR connection failed:', err);
        setConnectionState(connection.state);
        setIsConnected(false);

        // Retry after a delay
        setTimeout(() => {
          startConnection();
        }, 5000);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, [getAccessToken]);

  return (
    <SignalRContext.Provider value={{ isConnected, connectionState, lastSummaryUpdate }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};
