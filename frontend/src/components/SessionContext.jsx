import React, { createContext, useContext, useState } from 'react';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState({
    sessionStatus: 'waiting',
    bookingId: null,
    sessionToken: null,
    duration: 0,
    userType: 'client', // or 'lawyer'
    lawyer: null
  });

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}s
    </SessionContext.Provider>
  );
};
