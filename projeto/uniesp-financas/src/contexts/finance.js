import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './auth';

export const FinanceContext = createContext({});

export const formatDateForAPI = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function FinanceProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState({ saldo: 0, receita: 0, despesa: 0 });
  const [movements, setMovements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    if (!user) return;
    
    setLoading(true);
    const formattedDate = formatDateForAPI(selectedDate);
    
    try {
      const [balanceRes, movementsRes] = await Promise.all([
        api.get('/balance', { params: { date: formattedDate } }),
        api.get('/receives', { params: { date: formattedDate } })
      ]);
      
      console.log('Balance Response:', balanceRes.data);
      console.log('Movements Response:', movementsRes.data);
      
      // Lidar com o formato de array retornado pelo backend
      let balanceData = {};
      if (Array.isArray(balanceRes.data)) {
        balanceRes.data.forEach(item => {
          if (item.tag === 'saldo') balanceData.saldo = parseFloat(item.saldo) || 0;
          if (item.tag === 'receita') balanceData.receita = parseFloat(item.saldo) || 0;
          if (item.tag === 'despesa') balanceData.despesa = parseFloat(item.saldo) || 0;
        });
      } else {
        balanceData = balanceRes.data;
      }
      
      setBalance({
        saldo: parseFloat(balanceData.saldo) || 0,
        receita: parseFloat(balanceData.receita) || 0,
        despesa: parseFloat(balanceData.despesa) || 0
      });
      
      setMovements(movementsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', {
        message: error.message,
        response: error.response ? error.response.data : null,
        status: error.response ? error.response.status : null
      });
    } finally {
      setLoading(false);
    }
  };

  const addMovement = (newMovement) => {
    const newBalance = { ...balance };
    const value = parseFloat(newMovement.value);
    
    if (newMovement.type === 'receita') {
      newBalance.saldo += value;
      newBalance.receita += value;
    } else {
      newBalance.saldo -= value;
      newBalance.despesa += value;
    }
    
    setBalance(newBalance);
    setMovements(prev => [{ ...newMovement, id: newMovement.id || Date.now().toString() }, ...prev]);
  };

  const removeMovement = (movementId, movementValue, movementType) => {
    const value = parseFloat(movementValue);
    const newBalance = { ...balance };
    
    if (movementType === 'receita') {
      newBalance.saldo -= value;
      newBalance.receita -= value;
    } else {
      newBalance.saldo += value;
      newBalance.despesa -= value;
    }
    
    setBalance(newBalance);
    setMovements(prev => prev.filter(item => item.id !== movementId));
  };

  useEffect(() => {
    if (user) {
      fetchFinanceData();
    }
  }, [user, selectedDate]);

  return (
    <FinanceContext.Provider
      value={{
        balance,
        movements,
        selectedDate,
        setSelectedDate,
        loading,
        fetchFinanceData,
        addMovement,
        removeMovement
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}