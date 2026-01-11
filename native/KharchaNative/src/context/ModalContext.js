import React, { createContext, useContext, useState, useRef } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [addEntryModalVisible, setAddEntryModalVisible] = useState(false);
  const [cashWithdrawalModalVisible, setCashWithdrawalModalVisible] = useState(false);
  const [cashDepositModalVisible, setCashDepositModalVisible] = useState(false);
  
  // Store refs to allow external components to close modals
  const closeAllModalsRef = useRef(() => {});

  const openAddEntryModal = () => {
    setAddEntryModalVisible(true);
  };

  const closeAddEntryModal = () => {
    setAddEntryModalVisible(false);
  };

  const openCashWithdrawalModal = () => {
    setCashWithdrawalModalVisible(true);
  };

  const closeCashWithdrawalModal = () => {
    setCashWithdrawalModalVisible(false);
  };

  const openCashDepositModal = () => {
    setCashDepositModalVisible(true);
  };

  const closeCashDepositModal = () => {
    setCashDepositModalVisible(false);
  };

  const closeAllModals = () => {
    setAddEntryModalVisible(false);
    setCashWithdrawalModalVisible(false);
    setCashDepositModalVisible(false);
  };

  // Update ref so external components can call it
  closeAllModalsRef.current = closeAllModals;

  return (
    <ModalContext.Provider
      value={{
        addEntryModalVisible,
        openAddEntryModal,
        closeAddEntryModal,
        cashWithdrawalModalVisible,
        openCashWithdrawalModal,
        closeCashWithdrawalModal,
        cashDepositModalVisible,
        openCashDepositModal,
        closeCashDepositModal,
        closeAllModals,
        closeAllModalsRef,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
