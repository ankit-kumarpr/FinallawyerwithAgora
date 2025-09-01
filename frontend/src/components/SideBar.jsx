import React, { useState } from "react";
import "./sidebar.css";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaBook,
  FaFileContract,
  FaUserTie,
  FaGavel,
  FaHome,
  FaHistory,
  FaChartBar,
  FaCog,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClipboardList,
  FaUserPlus
} from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { MdOutlineProductionQuantityLimits, MdOutlineCategory } from "react-icons/md";
import { RiBriefcase4Fill, RiFileList3Fill } from "react-icons/ri";
import { PiChalkboardTeacherFill, PiStudentBold } from "react-icons/pi";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

const SideBar = () => {
  const [dropdowns, setDropdowns] = useState({
    cases: false,
    clients: false,
    documents: false,
    billing: false,
    history: false
  });

  const toggleDropdown = (name) => {
    setDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const role = sessionStorage.getItem("role");

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">

        {/* Admin Specific Items */}
        {role === "admin" && (
          <>
            <li className="nav-item">
              <Link className="nav-link" to="/Admin/customner">
                <FaUsers size={20} />
                <span>User Management</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Admin/lawyerManagement">
                <FaUsers size={20} />
                <span>Lawyer Management</span>
              </Link>
            </li>

            {/* <li className="nav-item">
              <div
                className={`nav-link ${dropdowns.cases ? "" : "collapsed"}`}
                onClick={() => toggleDropdown("cases")}
                style={{ cursor: "pointer" }}
              >
                <RiBriefcase4Fill size={20} />
                <span>Case Management</span>
                {dropdowns.cases ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
              </div>
              <ul className={`nav-content collapse ${dropdowns.cases ? "show" : ""}`}>
                <li><Link to="/cases/all"><i className="bi bi-circle" /> All Cases</Link></li>
                <li><Link to="/cases/active"><i className="bi bi-circle" /> Active Cases</Link></li>
                <li><Link to="/cases/closed"><i className="bi bi-circle" /> Closed Cases</Link></li>
              </ul>
            </li> */}

            <li className="nav-item">
              <div
                className={`nav-link ${dropdowns.history ? "" : "collapsed"}`}
                onClick={() => toggleDropdown("history")}
                style={{ cursor: "pointer" }}
              >
                <RiBriefcase4Fill size={20} />
                <span>History</span>
                {dropdowns.history ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
              </div>
              <ul className={`nav-content collapse ${dropdowns.history ? "show" : ""}`}>
                <li><Link to="/lawyer/history"><i className="bi bi-circle" /> Lawyer History</Link></li>
                <li><Link to="/user/history"><i className="bi bi-circle" /> User History</Link></li>
              </ul>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/admin/add-lawyer">
                <FaUserPlus size={20} />
                <span>Add Physical lawyer</span>
              </Link>
            </li>

            {/* <li className="nav-item">
              <Link className="nav-link" to="/settings">
                <FaCog size={20} />
                <span>System Settings</span>
              </Link>
            </li> */}
          </>
        )}

        {/* Lawyer Specific Items */}
        {role === "lawyer" && (
          <>
          <li className="nav-item">
              <Link className="nav-link" to="/lawyer/dashboard">
                <FaChartBar size={20} />
                <span>Dashboard</span>
              </Link>
            </li>
 <li className="nav-item">
              <Link className="nav-link" to="/lawyer/Lawyer_Profile">
                <FaUserTie size={20} />
                <span>Profile</span>
              </Link>
            </li>
            <li className="nav-item">
              <div
                className={`nav-link ${dropdowns.clients ? "" : "collapsed"}`}
                onClick={() => toggleDropdown("clients")}
                style={{ cursor: "pointer" }}
              >
                <FaUserTie size={20} />
                <span>Clients</span>
                {dropdowns.clients ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
              </div>
              <ul className={`nav-content collapse ${dropdowns.clients ? "show" : ""}`}>
                <li><Link to="/lawyer/ClientRquest"><i className="bi bi-circle" />Clients Requests</Link></li>
                {/* <li><Link to="/clients/add"><i className="bi bi-circle" /> Add New Client</Link></li> */}
              </ul>
            </li>

            {/* <li className="nav-item">
              <Link className="nav-link" to="/my-cases">
                <FaGavel size={20} />
                <span>My Cases</span>
              </Link>
            </li> */}

            {/* <li className="nav-item">
              <div
                className={`nav-link ${dropdowns.documents ? "" : "collapsed"}`}
                onClick={() => toggleDropdown("documents")}
                style={{ cursor: "pointer" }}
              >
                <RiFileList3Fill size={20} />
                <span>Documents</span>
                {dropdowns.documents ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
              </div>
              <ul className={`nav-content collapse ${dropdowns.documents ? "show" : ""}`}>
                <li><Link to="/documents/templates"><i className="bi bi-circle" /> Templates</Link></li>
                <li><Link to="/documents/upload"><i className="bi bi-circle" /> Upload Documents</Link></li>
              </ul>
            </li> */}

            {/* <li className="nav-item">
              <Link className="nav-link" to="/calendar">
                <FaCalendarAlt size={20} />
                <span>Calendar</span>
              </Link>
            </li> */}

            {/* <li className="nav-item">
              <Link className="nav-link" to="/billing">
                <FaMoneyBillWave size={20} />
                <span>Billing</span>
              </Link>
            </li> */}

            <li className="nav-item">
              <Link className="nav-link" to="/lawyer/Mybooking">
                <FaMoneyBillWave size={20} />
                <span>Booking</span>
              </Link>
            </li>

           
          </>
        )}

        {/* User (Customer) Specific Items */}
        {role === "user" && (
          <>
          <li className="nav-item">
              <Link className="nav-link" to="/user/dashboard">
                <FaChartBar size={20} />
                <span>Dashboard</span>
              </Link>
            </li>
           <li className="nav-item">
              <Link className="nav-link" to="/user/FindLawyer">
                <FaGavel size={20} />
                <span>Find a Lawyer</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/user/myrequest">
                <FaClipboardList size={20} />
                <span>My Requests</span>
              </Link>
            </li>

            {/* <li className="nav-item">
              <Link className="nav-link" to="/my-lawyers">
                <FaUserTie size={20} />
                <span>My Lawyers</span>
              </Link>
            </li> */}

            {/* <li className="nav-item">
              <Link className="nav-link" to="/my-documents">
                <FaFileContract size={20} />
                <span>My Documents</span>
              </Link>
            </li> */}

            <li className="nav-item">
              <Link className="nav-link" to="/user/CaseHistory">
                <FaHistory size={20} />
                <span>Case History</span>
              </Link>
            </li>

           

            <li className="nav-item">
              <Link className="nav-link" to="/user/profile">
                <FaUserTie size={20} />
                <span>Profile</span>
              </Link>
            </li>
          </>
        )}

        {/* Common Items */}
        {/* <li className="nav-item">
          <Link className="nav-link" to="/help">
            <i className="bi bi-question-circle" />
            <span>Help</span>
          </Link>
        </li> */}

        <li className="nav-item">
          <Link className="nav-link" to="/logout">
            <i className="fas fa-sign-out-alt" />
            <span>Log Out</span>
          </Link>
        </li>

      </ul>
    </aside>
  );
};

export default SideBar;
