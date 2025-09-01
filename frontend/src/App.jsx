// App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ForgetPassword from "./Pages/ForgetPassword";
import AuthPage from "./Pages/AuthPage";
import Allmain from "./components/Allmain";
import AuthRoute from "./components/AuthRoute";
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/newpassword/:token" element={<ForgetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <AuthRoute>
              <Allmain />
            </AuthRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
