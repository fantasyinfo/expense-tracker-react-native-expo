import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [addEntryModalVisible, setAddEntryModalVisible] = useState(false);

  const openAddEntryModal = () => {
    setAddEntryModalVisible(true);
  };

  const closeAddEntryModal = () => {
    setAddEntryModalVisible(false);
  };

  return (
    <ModalContext.Provider
      value={{
        addEntryModalVisible,
        openAddEntryModal,
        closeAddEntryModal,
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
