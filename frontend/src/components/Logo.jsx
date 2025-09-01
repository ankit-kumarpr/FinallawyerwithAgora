import React from 'react'
import './logo.css';
import logo from '/images/law2.jpg'
import { CiMenuFries } from "react-icons/ci";
import { HiMenuAlt1 } from "react-icons/hi";

function Logo() {
  const handleToggleSideBar = () => {
    document.body.classList.toggle('toggle-sidebar');
  };


  return (
    <div className='d-flex align-items-center justify-content-between'>
      <a href='/' className='logo d-flex align-items-center text-decoration-none'>

        <img src={logo} alt='Dream' style={{ height: "auto", width: "76px" }} />

      </a>
      <HiMenuAlt1 className='toggle-sidebar-btn m-2' onClick={handleToggleSideBar} />

    </div>
  )
}

export default Logo
