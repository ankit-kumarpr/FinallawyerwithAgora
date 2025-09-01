// components/Allmain.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./Header.jsx";
import SideBar from "./SideBar.jsx";
import AuthRoute from "./AuthRoute.jsx";
import Logout from "./LogOut.jsx";

import AdminDashboard from "../Pages/Admin/AdminDashboard.jsx";
import UserDashboard from "../Pages/user/UserDashboard.jsx";
import Lawyerdashboard from "../Pages/lawyer/LawyerDashbaord.jsx";
import LawyerManagement from "../Pages/Admin/LawyerManagement.jsx";
import CustomerManagement from "../Pages/Admin/CustomerManagement.jsx";
import ClientProfile from "../Pages/user/Profile.jsx";
import FindLawyer from "../Pages/user/FindLawyer.jsx";
import UserHistory from "../Pages/Admin/UserHistory.jsx";
import LawyerHistory from "../Pages/Admin/LawyerHistory.jsx";
import LawyerProfile from "../Pages/lawyer/Lawyer_Profile.jsx";
import Mybooking from "../Pages/lawyer/Mybooking.jsx";
import ClientRequests from "../Pages/lawyer/ClientRequest.jsx";
import ClientHistoryPage from "../Pages/user/ClientCaseHistory.jsx";
import MyRequests from "../Pages/user/MyRequests.jsx";
import AdminLawyerManagement from "../Pages/Admin/addPhysicalLawyer.jsx";

import "./main.css";

const Allmain = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("");

  useEffect(() => {
    const routeToTitle = {
      "/admin/dashboard": "Admin Dashboard",
      "/user/dashboard": "User Dashboard",
      "/lawyer/dashboard": "Lawyer Dashboard",
      "/lawyer/Lawyer_Profile": "Lawyer Profile",
      "/admin/lawyerManagement": "Manage Lawyers",
      "/admin/customner": "Manage Customers",
      "/admin/add-lawyer": "Add Physical Lawyer",
      "/user/profile": "Manage Profile",
      "/user/FindLawyer": "Find Lawyer",
      "/user/CaseHistory": "Case History",
      "/user/myrequest": "My Requests",
      "/lawyer/history": "Lawyer History",
      "/user/history": "User History",
      "/lawyer/Mybooking": "My Booking",
      "/lawyer/ClientRquest": "Client Request", // ✅ fix typo if needed
    };

    const title = routeToTitle[location.pathname];
    setPageTitle(title || "");
    document.title = title ? `${title} | LawConnect` : "LawConnect";
  }, [location.pathname]);

  return (
    <>
      <Header />
      <SideBar />
      <main
        id="main"
        className="main"
        style={{ background: "#f9f7f1", minHeight: "100vh" }}
      >
        <Routes>
          <Route path="/admin/dashboard" element={<AuthRoute><AdminDashboard /></AuthRoute>} />
          <Route path="/user/dashboard" element={<AuthRoute><UserDashboard /></AuthRoute>} />
          <Route path="/lawyer/dashboard" element={<AuthRoute><Lawyerdashboard /></AuthRoute>} />
          <Route path="/admin/lawyerManagement" element={<AuthRoute><LawyerManagement /></AuthRoute>} />
          <Route path="/admin/customner" element={<AuthRoute><CustomerManagement /></AuthRoute>} />
          <Route path="/admin/add-lawyer" element={<AuthRoute><AdminLawyerManagement /></AuthRoute>} />
          <Route path="/user/profile" element={<AuthRoute><ClientProfile /></AuthRoute>} />
          <Route path="/user/FindLawyer" element={<AuthRoute><FindLawyer /></AuthRoute>} />
          <Route path="/user/CaseHistory" element={<AuthRoute><ClientHistoryPage /></AuthRoute>} />
          <Route path="/lawyer/history" element={<AuthRoute><LawyerHistory /></AuthRoute>} />
          <Route path="/user/history" element={<AuthRoute><UserHistory /></AuthRoute>} />
          <Route path="/lawyer/Mybooking" element={<AuthRoute><Mybooking /></AuthRoute>} />
          <Route path="/lawyer/ClientRquest" element={<AuthRoute><ClientRequests /></AuthRoute>} />
          <Route path="/user/myrequest" element={<AuthRoute><MyRequests /></AuthRoute>} />
          <Route path="/lawyer/Lawyer_Profile" element={<AuthRoute><LawyerProfile /></AuthRoute>} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </main>
    </>
  );
};

export default Allmain;
